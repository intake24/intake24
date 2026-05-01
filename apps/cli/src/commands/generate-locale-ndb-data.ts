import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

import { cancel, group, intro, log, outro, spinner, text } from '@clack/prompts';
import { Transform } from '@json2csv/node';
import { Op } from 'sequelize';

import config from '@intake24/cli/config';
import { logger } from '@intake24/common-backend';
import {
  Database,
  Food,
  FoodsNutrientType,
  NutrientTableCsvMapping,
  NutrientTableCsvMappingNutrient,
} from '@intake24/db';

const FIXED_HEADERS = [
  'FCT record ID', // 0
  'FCT', // 1
  'Food ID', // 2
  'Locale', // 3
  'Food code', // 4
  'English name', // 5
  'Local name', // 6
  'Sub-group code', // 7
  'Alternative Name', // 8
  'Tags', // 9
];
const NUTRIENT_COL_START = 10;

export default async function genLocaleNdbData(): Promise<void> {
  intro('Generate locale NDB data CSV');

  const answers = await group(
    {
      localeId: () =>
        text({
          message: 'Locale ID (e.g. UK_current)',
          placeholder: 'UK_current',
          initialValue: 'UK_current',
          validate: (v: string | undefined) => (!v || v.trim().length === 0 ? 'Required' : undefined),
        }),
      tableId: () =>
        text({
          message: 'NDB table ID — leave blank to export all tables (nutrients ordered by ID, not offset-aligned)',
          placeholder: 'UK_NDB_3',
        }),
      outputPath: ({ results }) => {
        const table = results.tableId?.trim() || 'all';
        return text({
          message: 'Output file path',
          initialValue: `${results.localeId?.trim()}-${table}-data.csv`,
        });
      },
    },
    {
      onCancel: () => {
        cancel('Cancelled.');
        process.exit(0);
      },
    },
  );

  const tableId = (answers.tableId as string).trim();
  const localeId = (answers.localeId as string).trim();
  const outputPath = resolve((answers.outputPath as string).trim());
  const filterByTable = tableId.length > 0;

  if (!filterByTable) {
    log.warn('No table ID provided — all FCT records for the locale will be exported.');
    log.warn('Nutrient columns will be ordered by nutrient type ID, not by spreadsheet offset.');
    log.warn('This output is NOT suitable for "Nutrient table - Import NDB data". Use a specific table ID for that task.');
  }
  else {
    log.info(`Exporting "${tableId}" records for locale "${localeId}" with offset-aligned nutrient columns.`);
    log.info('Output is compatible with "Nutrient table - Import NDB data".');
  }

  const db = new Database({
    environment: (process.env.NODE_ENV as any) ?? 'development',
    databaseConfig: config.database,
    logger,
  });

  const s = spinner();

  try {
    await db.init();

    // --- Validate ---
    s.start('Validating inputs...');

    if (filterByTable) {
      const csvMapping = await NutrientTableCsvMapping.findOne({
        where: { nutrientTableId: tableId },
      });
      if (!csvMapping) {
        s.stop('Validation failed.');
        log.error(`No CSV mapping found for nutrient table "${tableId}". Run "Nutrient table - Import NDB mapping" first.`);
        process.exit(1);
      }
    }

    const linkedCount = await Food.count({
      where: { localeId },
      include: [{
        association: 'nutrientRecords',
        ...(filterByTable ? { where: { nutrientTableId: tableId } } : {}),
        required: true,
      }],
    });

    if (linkedCount === 0) {
      s.stop('No records to export.');
      log.warn(`No nutrient records linked to "${localeId}" foods. Nothing to export.`);
      process.exit(0);
    }

    s.stop(`Found ${linkedCount} linked food records.`);

    // --- Build nutrient column layout (only when filtering by specific table) ---
    s.start('Building column layout from mapping config...');

    let offsetByNutrientType = new Map<string, number>();
    const nutrientFields: { label: string; value: string }[] = [];

    const allNutrientTypes = await FoodsNutrientType.findAll({
      attributes: ['id', 'description'],
      order: [['id', 'ASC']],
    });

    if (filterByTable) {
      const mappingNutrients = await NutrientTableCsvMappingNutrient.findAll({
        where: { nutrientTableId: tableId, columnOffset: { [Op.gte]: NUTRIENT_COL_START } },
        order: [['columnOffset', 'ASC']],
      });

      const maxOffset = mappingNutrients.length > 0
        ? Math.max(...mappingNutrients.map(n => n.columnOffset))
        : NUTRIENT_COL_START - 1;

      const nutrientByOffset = new Map(mappingNutrients.map(n => [n.columnOffset, n.nutrientTypeId.toString()]));
      offsetByNutrientType = new Map(mappingNutrients.map(n => [n.nutrientTypeId.toString(), n.columnOffset]));
      const nutrientTypeById = new Map(allNutrientTypes.map(nt => [nt.id.toString(), nt.description]));

      for (let i = NUTRIENT_COL_START; i <= maxOffset; i++) {
        const nutrientTypeId = nutrientByOffset.get(i);
        nutrientFields.push({ label: nutrientTypeId ? (nutrientTypeById.get(nutrientTypeId) ?? '') : '', value: String(i) });
      }
    }
    else {
      // All-tables export: nutrients ordered by nutrient type ID, keyed as nt-{id}
      for (const nt of allNutrientTypes) {
        nutrientFields.push({ label: nt.description, value: `nt-${nt.id}` });
      }
    }

    const fixedFields = FIXED_HEADERS.map((label, i) => ({ label, value: `f${i}` }));

    s.stop('Column layout built.');

    // --- Stream foods with associated NTR data ---
    s.start(`Exporting to ${outputPath}...`);

    await mkdir(dirname(outputPath), { recursive: true });
    const out = createWriteStream(outputPath, { encoding: 'utf8' });

    const foods = Food.findAllWithStream({
      where: { localeId },
      include: [{
        association: 'nutrientRecords',
        ...(filterByTable ? { where: { nutrientTableId: tableId } } : {}),
        required: true,
        include: [
          { association: 'nutrients' },
          { association: 'fields' },
        ],
      }],
      order: [['code', 'ASC']],
    });

    const transform = new Transform(
      {
        fields: [...fixedFields, ...nutrientFields],
        withBOM: true,
        transforms: [
          (food: Food) => {
            const ntrs = food.nutrientRecords ?? [];
            if (!ntrs.length)
              return {};

            return ntrs.map((ntr) => {
              const obj: Record<string, string> = {
                f0: ntr.nutrientTableRecordId,
                f1: ntr.nutrientTableId,
                f2: food.id.toString(),
                f3: food.localeId,
                f4: food.code,
                f5: food.englishName,
                f6: food.name ?? '',
                f7: ntr.fields?.filter(f => f.name === 'sub_group_code').map(f => f.value).join(', ') ?? '',
                f8: Object.values(food.altNames ?? {}).flatMap(names => names).toSorted().join(', '),
                f9: (food.tags ?? []).toSorted().join(', '),
              };

              for (const n of ntr.nutrients ?? []) {
                const ntId = n.nutrientTypeId?.toString() ?? '';
                if (filterByTable) {
                  const offset = offsetByNutrientType.get(ntId);
                  if (offset !== undefined)
                    obj[String(offset)] = n.unitsPer100g.toString();
                }
                else {
                  obj[`nt-${ntId}`] = n.unitsPer100g.toString();
                }
              }

              return obj;
            });
          },
        ],
      },
      {},
      { objectMode: true },
    );

    await pipeline(foods, transform, out);

    s.stop(`Done. Exported ${linkedCount} records → ${outputPath}`);
    log.info('Depending on your setup, it can be used in Admin → Locale → Import food-nutrient mapping or Admin → Nutrient Tables → Import NDB data.');
    outro('Export complete.');
  }
  finally {
    await db.close();
  }
}
