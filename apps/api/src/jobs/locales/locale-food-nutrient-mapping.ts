import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { Transform } from '@json2csv/node';
import { format } from 'date-fns';

import { NotFoundError } from '@intake24/api/http/errors';
import { EMPTY } from '@intake24/api/services/admin/data-export';
import { addTime } from '@intake24/api/util';
import { buildNdbCsvLayout, buildNdbRow } from '@intake24/common-backend';
import {
  Job as DbJob,
  Food,
  FoodsNutrientType,
  NutrientTableCsvMapping,
  NutrientTableCsvMappingNutrient,
  SystemLocale,
} from '@intake24/db';

import BaseJob from '../job';

export default class LocaleFoodNutrientMapping extends BaseJob<'LocaleFoodNutrientMapping'> {
  readonly name = 'LocaleFoodNutrientMapping';

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

  private async prepareExportInfo() {
    const { localeId, nutrientTableId } = this.params;
    const locale = await SystemLocale.findByPk(localeId, { attributes: ['code'] });
    if (!locale)
      throw new NotFoundError(`Job ${this.name}: Locale not found (${localeId}).`);

    const { code: localeCode } = locale;
    const filterByTable = !!nutrientTableId?.trim();
    const tableId = nutrientTableId?.trim() ?? '';

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${localeCode}${filterByTable ? `-${tableId}` : ''}-${timestamp}.csv`;

    if (filterByTable) {
      const [csvMapping, allNutrientTypes, mappingNutrients] = await Promise.all([
        NutrientTableCsvMapping.findOne({ where: { nutrientTableId: tableId } }),
        FoodsNutrientType.findAll({ attributes: ['id', 'description'], order: [['id', 'ASC']] }),
        NutrientTableCsvMappingNutrient.findAll({
          where: { nutrientTableId: tableId },
          order: [['columnOffset', 'ASC']],
        }),
      ]);

      if (!csvMapping)
        throw new NotFoundError(`Job ${this.name}: No CSV mapping for "${tableId}". Run "Nutrient table - Import NDB mapping" first.`);

      const nutrientTypeById = new Map(allNutrientTypes.map(nt => [nt.id.toString(), nt.description]));
      const ndbLayout = buildNdbCsvLayout(csvMapping, mappingNutrients, nutrientTypeById);

      const total = await Food.count({
        where: { localeId: localeCode },
        include: [{ association: 'nutrientRecords', where: { nutrientTableId: tableId }, required: true }],
      });

      // `as const` makes filterByTable a literal discriminant so TypeScript narrows
      // the union in exportData() without a runtime assertion.
      return { localeCode, filename, fields: ndbLayout.fields, total, filterByTable: true as const, tableId, csvMapping, ndbLayout };
    }
    else {
      const nutrients = await FoodsNutrientType.findAll({
        attributes: ['id', 'description'],
        include: [{ association: 'unit', attributes: ['symbol'] }],
        order: [['id', 'asc']],
      });

      const fields = [
        { label: 'Locale', value: 'localeId' },
        { label: 'Food code', value: 'code' },
        { label: 'English name', value: 'englishName' },
        { label: 'Local name', value: 'name' },
        { label: 'FCT', value: 'nutrientTableId' },
        { label: 'FCT record ID', value: 'nutrientTableRecordId' },
        ...nutrients.map(nt => ({
          label: `${nt.description} (${nt.unit?.symbol ?? EMPTY})`,
          value: `nt-${nt.id}`,
        })),
      ];

      const total = await Food.count({ where: { localeId: localeCode } });

      return { localeCode, filename, fields, total, filterByTable: false as const };
    }
  }

  /**
   * Streams foods for the locale and writes a CSV to the downloads directory.
   *
   * Two modes depending on whether `nutrientTableId` was supplied:
   * - **NDB mode** — columns at exact offsets from `nutrient_table_csv_mapping*`;
   *   one row per food × NTR; compatible with "Nutrient table - Import NDB data".
   * - **All-tables mode** — `nt-{id}` columns ordered by nutrient type ID;
   *   one row per food × NTR across all linked tables; not offset-aligned.
   */
  private async exportData(): Promise<void> {
    const info = await this.prepareExportInfo();
    const { localeCode, fields, filename, total } = info;

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
        {
          association: 'nutrientRecords',
          ...(info.filterByTable ? { where: { nutrientTableId: info.tableId } } : {}),
          // INNER JOIN when filtering by table; LEFT JOIN otherwise so foods
          // without any NTR still appear in the all-tables export.
          required: info.filterByTable,
          include: [
            { association: 'nutrients' },
            { association: 'fields' },
          ],
        },
      ],
      order: [['code', 'asc']],
    });

    const transform = new Transform(
      {
        fields,
        withBOM: true,
        transforms: [
          (item: Food) => {
            const { nutrientRecords } = item;

            if (!nutrientRecords?.length) {
              return info.filterByTable
                ? []
                : { code: item.code, name: item.name ?? '', englishName: item.englishName, localeId: item.localeId };
            }

            if (info.filterByTable) {
              return nutrientRecords.map(ntr => buildNdbRow(item, ntr, info.ndbLayout, info.csvMapping));
            }
            else {
              return nutrientRecords.map((ntr) => {
                const { nutrientTableId, nutrientTableRecordId, nutrients = [] } = ntr;
                return {
                  code: item.code,
                  name: item.name ?? '',
                  englishName: item.englishName,
                  localeId: item.localeId,
                  nutrientTableId,
                  nutrientTableRecordId,
                  ...nutrients.reduce<Record<string, number>>((acc, n) => {
                    acc[`nt-${n.nutrientTypeId}`] = n.unitsPer100g;
                    return acc;
                  }, {}),
                };
              });
            }
          },
        ],
      },
      {},
      // objectMode: true selects @json2csv's object-mode tokenizer, which calls
      // pushLine(data) directly. Without it the stream expects JSON strings and
      // crashes on Food instances emitted by findAllWithStream.
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
