import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { Transform } from '@json2csv/node';
import { format } from 'date-fns';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import { offsetToExcelColumn } from '@intake24/common/util/strings';
import { Job as DbJob, NutrientTableCsvMappingNutrient } from '@intake24/db';

import BaseJob from '../job';

export default class NutrientTableMappingExport extends BaseJob<'NutrientTableMappingExport'> {
  readonly name = 'NutrientTableMappingExport';

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
    const mappings = await NutrientTableCsvMappingNutrient.findAll({
      where: { nutrientTableId },
      attributes: ['nutrientTypeId', 'columnOffset'],
      include: [{ association: 'nutrientType', attributes: ['description'] }],
      order: [['columnOffset', 'ASC'], ['nutrientTypeId', 'ASC']],
    });

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${nutrientTableId}-${timestamp}.csv`;
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), { encoding: 'utf-8', flags: 'w+' });
    const records = Readable.from(mappings.map(mapping => ({
      nutrientTypeId: mapping.nutrientTypeId,
      columnIndex: offsetToExcelColumn(mapping.columnOffset),
      nutrientName: mapping.nutrientType?.description ?? '',
    })));
    const transform = new Transform(
      {
        fields: [
          { label: 'Intake24 nutrient ID', value: 'nutrientTypeId' },
          { label: 'NDB spreadsheet column index', value: 'columnIndex' },
          { label: 'Nutrient name', value: 'nutrientName' },
        ],
        withBOM: true,
      },
      {},
      { objectMode: true },
    );

    await pipeline(records, transform, output);
    await this.dbJob.update({
      downloadUrl: filename,
      downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
      message: `Nutrient table mapping export: exported ${mappings.length} record${mappings.length === 1 ? '' : 's'} with 3 CSV columns.`,
    });
  }
}
