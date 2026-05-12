import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { cancel, group, intro, log, outro, spinner, text } from '@clack/prompts';
import { Transform } from '@json2csv/node';
import { Op } from 'sequelize';

import config from '@intake24/cli/config';
import { logger } from '@intake24/common-backend';
import {
  Database,
  Food,
  FoodNutrient,
  FoodsNutrientType,
  NutrientTableCsvMapping,
  NutrientTableCsvMappingNutrient,
  NutrientTableRecord,
  NutrientTableRecordField,
  NutrientTableRecordNutrient,
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

export default async function genLocaleNdbDataV2(): Promise<void> {
  intro('Generate locale NDB data CSV (v2)');

  const answers = await group(
    {
      tableId: () =>
        text({
          message: 'NDB table ID (e.g. UK_NDB_3)',
          placeholder: 'UK_NDB_3',
          initialValue: 'UK_NDB_3',
          validate: (v: string | undefined) => (!v || v.trim().length === 0 ? 'Required' : undefined),
        }),
      localeId: () =>
        text({
          message: 'Locale ID (e.g. UK_current)',
          placeholder: 'UK_current',
          initialValue: 'UK_current',
          validate: (v: string | undefined) => (!v || v.trim().length === 0 ? 'Required' : undefined),
        }),
      outputPath: ({ results }) =>
        text({
          message: 'Output file path',
          initialValue: `${results.tableId?.trim()}-${results.localeId?.trim()}-data.csv`,
        }),
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

    const csvMapping = await NutrientTableCsvMapping.findOne({
      where: { nutrientTableId: tableId },
    });
    if (!csvMapping) {
      s.stop('Validation failed.');
      log.error(`No CSV mapping found for nutrient table "${tableId}". Run "Nutrient table - Import NDB mapping" first.`);
      process.exit(1);
    }

    const foodCount = await Food.count({ where: { localeId } });
    if (foodCount === 0) {
      s.stop('Validation failed.');
      log.error(`No foods found for locale "${localeId}".`);
      process.exit(1);
    }

    // --- Find linked food ↔ NTR pairs ---
    const foodRows = await Food.findAll({ attributes: ['id'], where: { localeId }, raw: true });
    const foodIds = foodRows.map((r: any) => r.id);

    const ntrRecordRows = await NutrientTableRecord.findAll({
      attributes: ['id'],
      where: { nutrientTableId: tableId },
      raw: true,
    });
    const ntrRecordIds = ntrRecordRows.map((r: any) => r.id);

    const linkedRows = await FoodNutrient.findAll({
      attributes: ['foodId', 'nutrientTableRecordId'],
      where: { foodId: { [Op.in]: foodIds }, nutrientTableRecordId: { [Op.in]: ntrRecordIds } },
      raw: true,
    });

    if (linkedRows.length === 0) {
      s.stop('No records to export.');
      log.warn(`No "${tableId}" records linked to "${localeId}" foods. Nothing to export.`);
      process.exit(0);
    }

    // food internal id → NTR internal id
    const foodToNtr = new Map<string, string>();
    for (const row of linkedRows as any[]) {
      foodToNtr.set(row.foodId.toString(), row.nutrientTableRecordId.toString());
    }
    const linkedNtrIds = [...new Set([...foodToNtr.values()])];

    s.stop(`Found ${foodToNtr.size} linked food records.`);

    // --- Build nutrient column layout for offsets 10+ ---
    s.start('Building column layout from mapping config...');

    const [mappingNutrients, allNutrientTypes] = await Promise.all([
      NutrientTableCsvMappingNutrient.findAll({
        where: { nutrientTableId: tableId, columnOffset: { [Op.gte]: NUTRIENT_COL_START } },
        order: [['columnOffset', 'ASC']],
      }),
      FoodsNutrientType.findAll({ attributes: ['id', 'description'] }),
    ]);

    const maxOffset = mappingNutrients.length > 0
      ? Math.max(...mappingNutrients.map(n => n.columnOffset))
      : NUTRIENT_COL_START - 1;

    const nutrientByOffset = new Map(mappingNutrients.map(n => [n.columnOffset, n.nutrientTypeId.toString()]));
    const nutrientTypeById = new Map(allNutrientTypes.map(nt => [nt.id.toString(), nt.description]));

    // json2csv fields: fixed cols use string key names, nutrient cols use offset index as key
    const fixedFields = FIXED_HEADERS.map((label, i) => ({ label, value: `f${i}` }));

    const nutrientFields: { label: string; value: string }[] = [];
    for (let i = NUTRIENT_COL_START; i <= maxOffset; i++) {
      const nutrientTypeId = nutrientByOffset.get(i);
      const label = nutrientTypeId ? (nutrientTypeById.get(nutrientTypeId) ?? '') : '';
      nutrientFields.push({ label, value: String(i) });
    }

    const fields = [...fixedFields, ...nutrientFields];

    s.stop('Column layout built.');

    // --- Fetch food details and NTR data ---
    s.start(`Fetching data for ${foodToNtr.size} foods...`);

    const [foods, ntrRecords, allFields, allNutrients] = await Promise.all([
      Food.findAll({
        attributes: ['id', 'code', 'englishName', 'name', 'localeId', 'altNames', 'tags'],
        where: { id: { [Op.in]: [...foodToNtr.keys()] }, localeId },
        order: [['code', 'ASC']],
      }),
      NutrientTableRecord.findAll({
        attributes: ['id', 'nutrientTableRecordId'],
        where: { id: { [Op.in]: linkedNtrIds } },
        raw: true,
      }),
      NutrientTableRecordField.findAll({
        where: { nutrientTableRecordId: { [Op.in]: linkedNtrIds } },
        raw: true,
      }),
      NutrientTableRecordNutrient.findAll({
        where: { nutrientTableRecordId: { [Op.in]: linkedNtrIds } },
        raw: true,
      }),
    ]);

    // NTR internal id → FCT record ID string
    const ntrRecordIdById = new Map<string, string>(
      (ntrRecords as any[]).map(r => [r.id.toString(), r.nutrientTableRecordId]),
    );

    // NTR internal id → sub_group_code
    const subGroupByNtr = new Map<string, string>();
    for (const f of allFields as any[]) {
      if (f.name === 'sub_group_code')
        subGroupByNtr.set(f.nutrientTableRecordId.toString(), f.value);
    }

    // NTR internal id → nutrientTypeId → value
    const nutrientsByNtr = new Map<string, Map<string, string>>();
    for (const n of allNutrients as any[]) {
      const key = n.nutrientTableRecordId.toString();
      if (!nutrientsByNtr.has(key))
        nutrientsByNtr.set(key, new Map());
      if (n.nutrientTypeId !== null)
        nutrientsByNtr.get(key)!.set(n.nutrientTypeId.toString(), n.unitsPer100g.toString());
    }

    s.stop('Data fetched.');

    // --- Build row objects and stream through json2csv ---
    s.start(`Writing CSV to ${outputPath}...`);

    const rows = foods.flatMap((food) => {
      const foodId = food.id.toString();
      const ntrInternalId = foodToNtr.get(foodId);
      if (!ntrInternalId)
        return [];

      const recNutrients = nutrientsByNtr.get(ntrInternalId) ?? new Map<string, string>();

      const obj: Record<string, string> = {
        f0: ntrRecordIdById.get(ntrInternalId) ?? '',
        f1: tableId,
        f2: foodId,
        f3: food.localeId,
        f4: food.code,
        f5: food.englishName,
        f6: food.name ?? '',
        f7: subGroupByNtr.get(ntrInternalId) ?? '',
        f8: Object.values(food.altNames ?? {}).flatMap(names => names).toSorted().join(', '),
        f9: (food.tags ?? []).toSorted().join(', '),
      };

      for (let i = NUTRIENT_COL_START; i <= maxOffset; i++) {
        const nutrientTypeId = nutrientByOffset.get(i);
        obj[String(i)] = nutrientTypeId ? (recNutrients.get(nutrientTypeId) ?? '') : '';
      }

      return [obj];
    });

    await mkdir(dirname(outputPath), { recursive: true });
    const out = createWriteStream(outputPath, { encoding: 'utf8' });
    const transform = new Transform({ fields, withBOM: true }, {}, { objectMode: true });

    await pipeline(Readable.from(rows), transform, out);

    s.stop(`Done. Exported ${rows.length} records → ${outputPath}`);
    log.info('Upload via: Admin → Nutrient Tables → Import NDB data.');
    outro('Export complete.');
  }
  finally {
    await db.close();
  }
}
