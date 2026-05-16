import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

import { cancel, group, intro, log, outro, spinner, text } from '@clack/prompts';
import { Transform } from '@json2csv/node';

import config from '@intake24/cli/config';
import { buildNdbCsvLayout, buildNdbRow, logger } from '@intake24/common-backend';
import {
  Database,
  Food,
  FoodsNutrientType,
  NutrientTableCsvMapping,
  NutrientTableCsvMappingNutrient,
} from '@intake24/db';

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

    s.start('Validating inputs...');

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

    s.start('Building column layout...');

    let fields: { label: string; value: string }[] = [];
    let ndbLayout: ReturnType<typeof buildNdbCsvLayout> | null = null;
    let csvMapping: InstanceType<typeof NutrientTableCsvMapping> | null = null;

    const allNutrientTypes = await FoodsNutrientType.findAll({
      attributes: ['id', 'description'],
      order: [['id', 'ASC']],
    });

    if (filterByTable) {
      const [mapping, mappingNutrients] = await Promise.all([
        NutrientTableCsvMapping.findOne({ where: { nutrientTableId: tableId } }),
        NutrientTableCsvMappingNutrient.findAll({
          where: { nutrientTableId: tableId },
          order: [['columnOffset', 'ASC']],
        }),
      ]);

      if (!mapping) {
        s.stop('Validation failed.');
        log.error(`No CSV mapping found for nutrient table "${tableId}". Run "Nutrient table - Import NDB mapping" first.`);
        process.exit(1);
      }

      csvMapping = mapping;
      const nutrientTypeById = new Map(allNutrientTypes.map(nt => [nt.id.toString(), nt.description]));
      ndbLayout = buildNdbCsvLayout(csvMapping, mappingNutrients, nutrientTypeById);
      fields = ndbLayout.fields;
    }
    else {
      const nutrientFields: { label: string; value: string }[] = allNutrientTypes.map(nt => ({
        label: nt.description,
        value: `nt-${nt.id}`,
      }));
      fields = nutrientFields;
    }

    s.stop('Column layout built.');

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
        fields,
        withBOM: true,
        transforms: [
          (food: Food) => {
            const ntrs = food.nutrientRecords ?? [];
            if (!ntrs.length)
              return {};

            if (filterByTable) {
              return ntrs.map(ntr => buildNdbRow(food, ntr, ndbLayout!, csvMapping!));
            }
            else {
              return ntrs.map((ntr) => {
                const obj: Record<string, string> = {};
                for (const n of ntr.nutrients ?? []) {
                  const ntId = n.nutrientTypeId?.toString() ?? '';
                  obj[`nt-${ntId}`] = n.unitsPer100g.toString();
                }
                return obj;
              });
            }
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
