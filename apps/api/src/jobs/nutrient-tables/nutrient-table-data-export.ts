import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { format } from 'date-fns';
import { format as formatCsv } from 'fast-csv';
import { sql } from 'kysely';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import {
  Job as DbJob,
  NutrientTable,
} from '@intake24/db';

import BaseJob from '../job';

const BATCH_SIZE = 200;

export default class NutrientTableDataExport extends BaseJob<'NutrientTableDataExport'> {
  readonly name = 'NutrientTableDataExport';

  private dbJob!: DbJob;

  private readonly fsConfig;
  private readonly kyselyDb;

  constructor({ fsConfig, kyselyDb, logger }: Pick<IoC, 'fsConfig' | 'kyselyDb' | 'logger'>) {
    super({ logger });

    this.fsConfig = fsConfig;
    this.kyselyDb = kyselyDb;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.exportData();

    this.logger.debug('Job finished.');
  }

  private async exportData(): Promise<void> {
    const { nutrientTableId } = this.params;
    const nutrientTable = await NutrientTable.findByPk(nutrientTableId, {
      attributes: ['id'],
      include: [
        { association: 'csvMapping', required: true },
        { association: 'csvMappingFields', separate: true },
        {
          association: 'csvMappingNutrients',
          separate: true,
          include: [{ association: 'nutrientType', attributes: ['description'] }],
        },
      ],
    });
    if (!nutrientTable?.csvMapping)
      throw new Error(`Nutrient table data export: no CSV mapping configured for nutrient table "${nutrientTableId}".`);

    const { csvMapping, csvMappingFields = [], csvMappingNutrients = [] } = nutrientTable;
    const maxOffset = Math.max(
      csvMapping.idColumnOffset,
      csvMapping.descriptionColumnOffset,
      csvMapping.localDescriptionColumnOffset ?? 0,
      ...csvMappingFields.map(({ columnOffset }) => columnOffset),
      ...csvMappingNutrients.map(({ columnOffset }) => columnOffset),
    );
    const header = Array.from<string>({ length: maxOffset + 1 }).fill('');
    header[csvMapping.idColumnOffset] = 'NDB food ID (FCT record ID)';
    header[csvMapping.descriptionColumnOffset] = 'NDB food description';
    if (csvMapping.localDescriptionColumnOffset !== null)
      header[csvMapping.localDescriptionColumnOffset] = 'NDB local food description';
    for (const mapping of csvMappingFields)
      header[mapping.columnOffset] = mapping.fieldName;
    for (const mapping of csvMappingNutrients)
      header[mapping.columnOffset] = mapping.nutrientType?.description ?? '';

    const fields = new Map(csvMappingFields.map(mapping => [mapping.fieldName, mapping.columnOffset]));
    const nutrients = new Map(csvMappingNutrients.map(mapping => [mapping.nutrientTypeId, mapping.columnOffset]));
    let recordCount = 0;
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${nutrientTableId}-${timestamp}.csv`;
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), { encoding: 'utf-8', flags: 'w+' });
    const setProgress = this.setProgress.bind(this);

    await this.kyselyDb.foods.transaction().setIsolationLevel('repeatable read').execute(async (transaction) => {
      const { total } = await transaction
        .selectFrom('nutrientTableRecords')
        .select(({ fn }) => [fn.count<number>('id').as('total')])
        .where('nutrientTableId', '=', nutrientTableId)
        .executeTakeFirstOrThrow();
      this.initProgress(Number(total));

      const rows = async function* () {
        if (csvMapping.rowOffset)
          yield header;
        for (let index = 1; index < csvMapping.rowOffset; index++)
          yield [];

        let lastRecordId: string | null = null;
        while (true) {
          let recordsQuery = transaction
            .selectFrom('nutrientTableRecords')
            .select(['id', 'nutrientTableRecordId', 'name', 'localName'])
            .where('nutrientTableId', '=', nutrientTableId);
          if (lastRecordId !== null)
            recordsQuery = recordsQuery.where('nutrientTableRecordId', '>', lastRecordId);
          const records = await recordsQuery
            .orderBy('nutrientTableRecordId')
            .limit(BATCH_SIZE)
            .execute();
          if (!records.length)
            return;

          const recordIds = records.map(({ id }) => id);
          const recordFields = await transaction
            .selectFrom('nutrientTableRecordFields')
            .select(['nutrientTableRecordId', 'name', 'value'])
            .where('nutrientTableRecordId', 'in', recordIds)
            .execute();
          const recordNutrients = await transaction
            .selectFrom('nutrientTableRecordNutrients')
            .select([
              'nutrientTableRecordId',
              'nutrientTypeId',
              sql<number>`nutrient_table_record_nutrients.units_per_100g`.as('unitsPer100g'),
            ])
            .where('nutrientTableRecordId', 'in', recordIds)
            .execute();

          const rowsByRecordId = new Map(records.map((record) => {
            const row = Array.from<string>({ length: maxOffset + 1 }).fill('');
            row[csvMapping.idColumnOffset] = record.nutrientTableRecordId;
            row[csvMapping.descriptionColumnOffset] = record.name;
            if (csvMapping.localDescriptionColumnOffset !== null)
              row[csvMapping.localDescriptionColumnOffset] = record.localName ?? '';
            return [record.id, row];
          }));
          for (const recordField of recordFields) {
            const columnOffset = fields.get(recordField.name);
            if (columnOffset !== undefined)
              rowsByRecordId.get(recordField.nutrientTableRecordId)![columnOffset] = recordField.value;
          }
          for (const recordNutrient of recordNutrients) {
            if (recordNutrient.nutrientTypeId !== null) {
              const columnOffset = nutrients.get(recordNutrient.nutrientTypeId.toString());
              if (columnOffset !== undefined)
                rowsByRecordId.get(recordNutrient.nutrientTableRecordId)![columnOffset] = String(recordNutrient.unitsPer100g);
            }
          }

          for (const record of records)
            yield rowsByRecordId.get(record.id)!;

          recordCount += records.length;
          await setProgress(recordCount);
          lastRecordId = records.at(-1)!.nutrientTableRecordId;
        }
      };
      await pipeline(
        Readable.from(rows()),
        formatCsv({ headers: false }),
        output,
      );
    });
    await this.dbJob.update({
      downloadUrl: filename,
      downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
      message: `Nutrient table data export: exported ${recordCount} record${recordCount === 1 ? '' : 's'} with ${maxOffset + 1} CSV columns.${csvMapping.rowOffset ? '' : ' No headers were included because rowOffset is 0.'}`,
    });
  }
}
