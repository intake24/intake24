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
    if (csvMapping.localDescriptionColumnOffset)
      header[csvMapping.localDescriptionColumnOffset] = 'NDB local food description';
    for (const mapping of csvMappingFields)
      header[mapping.columnOffset] = mapping.fieldName;
    for (const mapping of csvMappingNutrients)
      header[mapping.columnOffset] = mapping.nutrientType?.description ?? '';

    const { total } = await this.kyselyDb.foods
      .selectFrom('nutrientTableRecords')
      .select(({ fn }) => [fn.count<number>('id').as('total')])
      .where('nutrientTableId', '=', nutrientTableId)
      .executeTakeFirstOrThrow();
    this.initProgress(Number(total));

    const fields = new Map(csvMappingFields.map(mapping => [mapping.fieldName, mapping.columnOffset]));
    const nutrients = new Map(csvMappingNutrients.map(mapping => [mapping.nutrientTypeId, mapping.columnOffset]));
    const cursor = this.kyselyDb.foods
      .selectFrom('nutrientTableRecords')
      .leftJoin('nutrientTableRecordFields', 'nutrientTableRecordFields.nutrientTableRecordId', 'nutrientTableRecords.id')
      .leftJoin('nutrientTableRecordNutrients', 'nutrientTableRecordNutrients.nutrientTableRecordId', 'nutrientTableRecords.id')
      .select([
        'nutrientTableRecords.id',
        'nutrientTableRecords.nutrientTableRecordId',
        'nutrientTableRecords.name',
        'nutrientTableRecords.localName',
        'nutrientTableRecordFields.name as fieldName',
        'nutrientTableRecordFields.value as fieldValue',
        'nutrientTableRecordNutrients.nutrientTypeId',
        sql<number | null>`nutrient_table_record_nutrients.units_per_100g`.as('unitsPer100g'),
      ])
      .where('nutrientTableRecords.nutrientTableId', '=', nutrientTableId)
      .orderBy('nutrientTableRecords.nutrientTableRecordId')
      .stream();
    let recordCount = 0;
    const rows = (async function* () {
      if (csvMapping.rowOffset)
        yield header;
      for (let index = 1; index < csvMapping.rowOffset; index++)
        yield [];

      let currentId: string | null = null;
      let row: string[] | null = null;

      for await (const record of cursor) {
        if (currentId !== null && currentId !== record.id) {
          if (row)
            yield row;
          row = null;
        }

        if (!row) {
          currentId = record.id;
          recordCount++;
          row = Array.from<string>({ length: maxOffset + 1 }).fill('');
          row[csvMapping.idColumnOffset] = record.nutrientTableRecordId;
          row[csvMapping.descriptionColumnOffset] = record.name;
          if (csvMapping.localDescriptionColumnOffset)
            row[csvMapping.localDescriptionColumnOffset] = record.localName ?? '';
        }

        if (record.fieldName) {
          const columnOffset = fields.get(record.fieldName);
          if (columnOffset !== undefined)
            row[columnOffset] = record.fieldValue ?? '';
        }

        if (record.nutrientTypeId !== null) {
          const columnOffset = nutrients.get(record.nutrientTypeId.toString());
          if (columnOffset !== undefined)
            row[columnOffset] = String(record.unitsPer100g ?? 0);
        }
      }

      if (row)
        yield row;
    })();

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${nutrientTableId}-${timestamp}.csv`;
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), { encoding: 'utf-8', flags: 'w+' });
    const progressInterval = setInterval(async () => {
      await this.setProgress(recordCount);
    }, 2000);
    try {
      await pipeline(
        Readable.from(rows),
        formatCsv({ headers: false }),
        output,
      );
      await this.setProgress(recordCount);
    }
    finally {
      clearInterval(progressInterval);
    }
    await this.dbJob.update({
      downloadUrl: filename,
      downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
      message: `Nutrient table data export: exported ${recordCount} record${recordCount === 1 ? '' : 's'} with ${maxOffset + 1} CSV columns.${csvMapping.rowOffset ? '' : ' No headers were included because rowOffset is 0.'}`,
    });
  }
}
