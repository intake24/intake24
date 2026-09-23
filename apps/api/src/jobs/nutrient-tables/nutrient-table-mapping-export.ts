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
import { Job as DbJob } from '@intake24/db';

import BaseJob from '../job';

export default class NutrientTableMappingExport extends BaseJob<'NutrientTableMappingExport'> {
  readonly name = 'NutrientTableMappingExport';

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
    const { total } = await this.kyselyDb.foods
      .selectFrom('nutrientTableCsvMappingNutrients')
      .select(({ fn }) => [fn.count<number>('id').as('total')])
      .where('nutrientTableId', '=', nutrientTableId)
      .executeTakeFirstOrThrow();
    const recordCount = Number(total);
    const cursor = this.kyselyDb.foods
      .selectFrom('nutrientTableCsvMappingNutrients')
      .innerJoin('nutrientTypes', 'nutrientTypes.id', 'nutrientTableCsvMappingNutrients.nutrientTypeId')
      .select([
        'nutrientTableCsvMappingNutrients.nutrientTypeId',
        'nutrientTableCsvMappingNutrients.columnOffset',
        'nutrientTypes.description as nutrientName',
      ])
      .where('nutrientTableCsvMappingNutrients.nutrientTableId', '=', nutrientTableId)
      .orderBy('nutrientTableCsvMappingNutrients.columnOffset')
      .orderBy('nutrientTableCsvMappingNutrients.nutrientTypeId')
      .stream();

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${nutrientTableId}-${timestamp}.csv`;
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), { encoding: 'utf-8', flags: 'w+' });
    const records = Readable.from(cursor);
    const transform = new Transform(
      {
        fields: [
          { label: 'Intake24 nutrient ID', value: 'nutrientTypeId' },
          { label: 'NDB spreadsheet column index', value: (row: { columnOffset: number }) => offsetToExcelColumn(row.columnOffset) },
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
      message: `Nutrient table mapping export: exported ${recordCount} record${recordCount === 1 ? '' : 's'} with 3 CSV columns.`,
    });
  }
}
