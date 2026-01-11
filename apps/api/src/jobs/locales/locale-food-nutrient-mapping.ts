import type { Job } from 'bullmq';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from '@json2csv/node';
import { format } from 'date-fns';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { EMPTY } from '@intake24/api/services/admin/data-export';
import { addTime } from '@intake24/api/util';
import { Job as DbJob, Food, FoodsNutrientType, SystemLocale } from '@intake24/db';
import BaseJob from '../job';

export default class LocaleFoodNutrientMapping extends BaseJob<'LocaleFoodNutrientMapping'> {
  readonly name = 'LocaleFoodNutrientMapping';

  private dbJob!: DbJob;

  private readonly fsConfig;

  constructor({ fsConfig, logger }: Pick<IoC, 'fsConfig' | 'logger'>) {
    super({ logger });

    this.fsConfig = fsConfig;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof LocaleFoodNutrientMapping
   */
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

  private async prepareExportInfo() {
    const { localeId } = this.params;
    const locale = await SystemLocale.findByPk(localeId, { attributes: ['code'] });
    if (!locale)
      throw new NotFoundError(`Job ${this.name}: Locale not found (${localeId}).`);

    const { code: localeCode } = locale;

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${localeCode}-${timestamp}.csv`;

    const [nutrients, total] = await Promise.all([
      FoodsNutrientType.findAll({
        attributes: ['id', 'description'],
        include: [{ association: 'unit', attributes: ['symbol'] }],
        order: [['id', 'asc']],
      }),
      Food.count({ where: { localeId: localeCode } }),
    ]);

    const nutrientFields = nutrients.map(nutrient => ({
      label: `${nutrient.description} (${nutrient.unit?.symbol ?? EMPTY})`,
      value: `nt-${nutrient.id}`,
    }));

    const foodFields = [
      { label: 'Locale', value: 'localeId' },
      { label: 'Food code', value: 'code' },
      { label: 'English name', value: 'englishName' },
      { label: 'Local name', value: 'name' },
      { label: 'FCT', value: 'nutrientTableId' },
      { label: 'FCT record ID', value: 'nutrientTableRecordId' },
    ];

    const fields = [...foodFields, ...nutrientFields];

    return { localeCode, filename, fields, total };
  }

  /**
   *
   *
   * @private
   * @returns {Promise<void>}
   * @memberof LocaleFoodNutrientMapping
   */
  private async exportData(): Promise<void> {
    const { localeCode, fields, filename, total } = await this.prepareExportInfo();

    this.initProgress(total);

    let counter = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(counter);
    }, 2000);

    const filepath = path.resolve(this.fsConfig.local.downloads, filename);
    const output = createWriteStream(filepath, { encoding: 'utf-8', flags: 'w+' });

    const foods = Food.findAllWithStream({
      where: { localeId: localeCode },
      include: [
        { association: 'nutrientRecords', include: [{ association: 'nutrients' }] },
      ],
      order: [['code', 'asc']],
    });

    const transform = new Transform(
      {
        fields,
        withBOM: true,
        transforms: [
          (item: Food) => {
            const {
              code,
              englishName,
              name,
              localeId,
              nutrientRecords,
            } = item;

            if (!nutrientRecords?.length)
              return { code, name, englishName, localeId };

            const { nutrientTableId, nutrientTableRecordId, nutrients = [] } = nutrientRecords[0];

            const nutrientData = nutrients.reduce<Record<string, number>>((acc, nutrient) => {
              acc[`nt-${nutrient.nutrientTypeId}`] = nutrient.unitsPer100g;
              return acc;
            }, {});

            return {
              code,
              name,
              englishName,
              localeId,
              nutrientTableId,
              nutrientTableRecordId,
              ...nutrientData,
            };
          },
        ],
      },
      {},
      { objectMode: true },
    );

    transform.on('data', () => {
      counter++;
    });

    try {
      await pipeline(foods, transform, output);
      await this.dbJob.update({
        downloadUrl: filename,
        downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
      });
    }
    finally {
      clearInterval(progressInterval);
    }
  }
}
