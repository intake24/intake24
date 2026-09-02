import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { format } from 'date-fns';
import { format as formatCsv } from 'fast-csv';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import {
  Job as DbJob,
  NutrientTable,
  NutrientTableRecord,
} from '@intake24/db';

import BaseJob from '../job';

export default class NutrientTableDataExport extends BaseJob<'NutrientTableDataExport'> {
  readonly name = 'NutrientTableDataExport';

  private dbJob!: DbJob;

  private readonly fsConfig;

  constructor({ fsConfig, logger }: Pick<IoC, 'fsConfig' | 'logger'>) {
    super({ logger });

    this.fsConfig = fsConfig;
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

    const records = await NutrientTableRecord.findAll({
      where: { nutrientTableId },
      include: [
        { association: 'fields', attributes: ['name', 'value'] },
        { association: 'nutrients', attributes: ['nutrientTypeId', 'unitsPer100g'] },
      ],
      order: [['nutrientTableRecordId', 'ASC']],
    });
    const rows = records.map((record) => {
      const row = Array.from<string>({ length: maxOffset + 1 }).fill('');
      row[csvMapping.idColumnOffset] = record.nutrientTableRecordId;
      row[csvMapping.descriptionColumnOffset] = record.name;
      if (csvMapping.localDescriptionColumnOffset)
        row[csvMapping.localDescriptionColumnOffset] = record.localName ?? '';
      for (const mapping of csvMappingFields)
        row[mapping.columnOffset] = record.fields?.find(field => field.name === mapping.fieldName)?.value ?? '';
      for (const mapping of csvMappingNutrients)
        row[mapping.columnOffset] = String(record.nutrients?.find(nutrient => nutrient.nutrientTypeId === mapping.nutrientTypeId)?.unitsPer100g ?? 0);
      return row;
    });

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${nutrientTableId}-${timestamp}.csv`;
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), { encoding: 'utf-8', flags: 'w+' });
    await pipeline(
      Readable.from([
        ...Array.from({ length: Math.max(csvMapping.rowOffset - 1, 0) }, () => []),
        ...(csvMapping.rowOffset ? [header] : []),
        ...rows,
      ]),
      formatCsv({ headers: false }),
      output,
    );
    await this.dbJob.update({
      downloadUrl: filename,
      downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
      message: `Nutrient table data export: exported ${records.length} record${records.length === 1 ? '' : 's'} with ${maxOffset + 1} CSV columns.${csvMapping.rowOffset ? '' : ' No headers were included because rowOffset is 0.'}`,
    });
  }
}
