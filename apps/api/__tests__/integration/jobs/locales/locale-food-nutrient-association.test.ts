import { randomUUID } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Job as BullJob } from 'bullmq';
import { vi } from 'vitest';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import {
  Job as DbJob,
  Food,
  FoodNutrient,
  NutrientTable,
  NutrientTableRecord,
} from '@intake24/db';

export default () => {
  const locale = () => suite.data.system.Locale;
  const fsConfig = ioc.resolve('fsConfig');

  let dbJob: DbJob | null = null;
  let food: Food | null = null;
  let nutrientTable: NutrientTable | null = null;
  let nutrientTableRecord: NutrientTableRecord | null = null;
  let missingSourceRecord: NutrientTableRecord | null = null;
  let targetNutrientTable: NutrientTable | null = null;
  let targetNutrientTableRecord: NutrientTableRecord | null = null;
  let inputFile: string | null = null;
  let auditFile: string | null = null;

  afterEach(async () => {
    if (food)
      await FoodNutrient.destroy({ where: { foodId: food.id } });

    await Promise.all([
      food?.destroy(),
      nutrientTableRecord?.destroy(),
      missingSourceRecord?.destroy(),
      nutrientTable?.destroy(),
      targetNutrientTableRecord?.destroy(),
      targetNutrientTable?.destroy(),
      dbJob?.destroy(),
      inputFile ? unlink(inputFile).catch(() => undefined) : undefined,
      auditFile ? unlink(auditFile).catch(() => undefined) : undefined,
    ]);

    dbJob = null;
    food = null;
    nutrientTable = null;
    nutrientTableRecord = null;
    missingSourceRecord = null;
    targetNutrientTable = null;
    targetNutrientTableRecord = null;
    inputFile = null;
    auditFile = null;
  });

  it('creates a missing association from a CSV and reports progress', async () => {
    const nutrientTableId = `NDB_ASSOC_${Date.now()}`;
    nutrientTable = await NutrientTable.create({ id: nutrientTableId, description: 'Association test table' });
    nutrientTableRecord = await NutrientTableRecord.create({
      nutrientTableId,
      nutrientTableRecordId: '0030040',
      name: 'Association test record',
    });
    food = await Food.create({
      code: 'ARRW',
      localeId: locale().code,
      englishName: 'Association test food',
      name: 'Association test food',
      version: randomUUID(),
    });

    inputFile = path.resolve(fsConfig.local.downloads, `locale-food-nutrient-association-${randomUUID()}.csv`);
    await writeFile(inputFile, [
      'Locale,Food code,FCT (NDB name),FCT record ID (NDB Food Code)',
      `${locale().code},ARRW,${nutrientTableId},0030040`,
    ].join('\n'));

    dbJob = await DbJob.create({
      type: 'LocaleFoodNutrientAssociation',
      userId: suite.data.system.user.id,
      params: { localeId: locale().id, mode: 'associate', file: inputFile, dryRun: false },
    });
    const bullJob = {
      id: `db-${dbJob.id}`,
      data: { params: dbJob.params },
      updateProgress: vi.fn(),
      returnvalue: null,
    } as unknown as BullJob;

    await ioc.resolve('LocaleFoodNutrientAssociation').run(bullJob);

    expect(await FoodNutrient.findOne({
      where: { foodId: food.id, nutrientTableRecordId: nutrientTableRecord.id },
    })).not.toBeNull();
    expect(bullJob.updateProgress).toHaveBeenCalledWith(1);

    const completedJob = await DbJob.findByPk(dbJob.id);
    auditFile = path.resolve(fsConfig.local.downloads, completedJob?.downloadUrl ?? '');
    expect(completedJob?.message).toBe('Locale food nutrient association: created 1, skipped 0, failed 0.');

    const auditCsv = await readFile(auditFile, 'utf-8');
    expect(auditCsv).toContain('Outcome,Reason');
    expect(auditCsv).toContain(`${locale().code},ARRW,${nutrientTableId},0030040,created,`);
  });

  it('partially replaces source mappings and reports target records that are missing', async () => {
    const sourceId = `NDB_SOURCE_${Date.now()}`;
    const targetId = `NDB_TARGET_${Date.now()}`;
    nutrientTable = await NutrientTable.create({ id: sourceId, description: 'Source table' });
    targetNutrientTable = await NutrientTable.create({ id: targetId, description: 'Target table' });
    nutrientTableRecord = await NutrientTableRecord.create({
      nutrientTableId: sourceId,
      nutrientTableRecordId: '30040',
      name: 'Source record',
    });
    targetNutrientTableRecord = await NutrientTableRecord.create({
      nutrientTableId: targetId,
      nutrientTableRecordId: '30040',
      name: 'Target record',
    });
    missingSourceRecord = await NutrientTableRecord.create({
      nutrientTableId: sourceId,
      nutrientTableRecordId: '40400',
      name: 'Missing target record',
    });
    food = await Food.create({
      code: 'ARRW',
      localeId: locale().code,
      englishName: 'Association test food',
      name: 'Association test food',
      version: randomUUID(),
    });
    await FoodNutrient.create({ foodId: food.id, nutrientTableRecordId: nutrientTableRecord.id });
    await FoodNutrient.create({ foodId: food.id, nutrientTableRecordId: missingSourceRecord.id });

    dbJob = await DbJob.create({
      type: 'LocaleFoodNutrientAssociation',
      userId: suite.data.system.user.id,
      params: {
        localeId: locale().id,
        mode: 'replace',
        sourceNutrientTableId: sourceId,
        targetNutrientTableId: targetId,
        dryRun: false,
      },
    });
    const bullJob = {
      id: `db-${dbJob.id}`,
      data: { params: dbJob.params },
      updateProgress: vi.fn(),
      returnvalue: null,
    } as unknown as BullJob;

    await ioc.resolve('LocaleFoodNutrientAssociation').run(bullJob);

    expect(await FoodNutrient.findOne({
      where: { foodId: food.id, nutrientTableRecordId: nutrientTableRecord.id },
    })).toBeNull();
    expect(await FoodNutrient.findOne({
      where: { foodId: food.id, nutrientTableRecordId: targetNutrientTableRecord.id },
    })).not.toBeNull();
    expect(await FoodNutrient.findOne({
      where: { foodId: food.id, nutrientTableRecordId: missingSourceRecord.id },
    })).not.toBeNull();
    expect(bullJob.updateProgress).toHaveBeenCalledWith(1);
    const completedJob = await DbJob.findByPk(dbJob.id);
    auditFile = path.resolve(fsConfig.local.downloads, completedJob?.downloadUrl ?? '');
    expect(completedJob?.message).toBe('Locale food nutrient association: found 2 source associations, replaced 1, failed 1.');
    const auditCsv = await readFile(auditFile, 'utf-8');
    expect(auditCsv).toContain(`${locale().code},ARRW,${sourceId},30040,${targetId},replaced,`);
    expect(auditCsv).toContain(`${locale().code},ARRW,${sourceId},40400,${targetId},failed,FCT record ID not found in target nutrient table.`);
  });

  it('dry-runs CSV associations and reports unresolved nutrient-table references', async () => {
    const nutrientTableId = `NDB_DRY_${Date.now()}`;
    nutrientTable = await NutrientTable.create({ id: nutrientTableId, description: 'Dry-run table' });
    nutrientTableRecord = await NutrientTableRecord.create({
      nutrientTableId,
      nutrientTableRecordId: '0030040',
      name: 'Dry-run record',
    });
    food = await Food.create({
      code: 'ARRW',
      localeId: locale().code,
      englishName: 'Association test food',
      name: 'Association test food',
      version: randomUUID(),
    });

    inputFile = path.resolve(fsConfig.local.downloads, `locale-food-nutrient-association-${randomUUID()}.csv`);
    await writeFile(inputFile, [
      'Locale,Food code,FCT (NDB name),FCT record ID (NDB Food Code)',
      `${locale().code},ARRW,${nutrientTableId},0030040`,
      `${locale().code},ARRW,NDB_DOES_NOT_EXIST,0030040`,
      `${locale().code},ARRW,${nutrientTableId},0030041`,
    ].join('\n'));

    dbJob = await DbJob.create({
      type: 'LocaleFoodNutrientAssociation',
      userId: suite.data.system.user.id,
      params: { localeId: locale().id, mode: 'associate', file: inputFile, dryRun: true },
    });
    const bullJob = {
      id: `db-${dbJob.id}`,
      data: { params: dbJob.params },
      updateProgress: vi.fn(),
      returnvalue: null,
    } as unknown as BullJob;

    await ioc.resolve('LocaleFoodNutrientAssociation').run(bullJob);

    expect(await FoodNutrient.findOne({
      where: { foodId: food.id, nutrientTableRecordId: nutrientTableRecord.id },
    })).toBeNull();
    expect((await DbJob.findByPk(dbJob.id))?.message).toBe('Locale food nutrient association: would create 1, skipped 0, failed 2.');

    const completedJob = await DbJob.findByPk(dbJob.id);
    auditFile = path.resolve(fsConfig.local.downloads, completedJob?.downloadUrl ?? '');
    const auditCsv = await readFile(auditFile, 'utf-8');
    expect(auditCsv).toContain(`${locale().code},ARRW,${nutrientTableId},0030040,would create,`);
    expect(auditCsv).toContain(`${locale().code},ARRW,NDB_DOES_NOT_EXIST,0030040,failed,Nutrient table not found.`);
    expect(auditCsv).toContain(`${locale().code},ARRW,${nutrientTableId},0030041,failed,FCT record ID not found in the specified nutrient table.`);
  });

  it('rejects a malformed association CSV without escaping the job', async () => {
    inputFile = path.resolve(fsConfig.local.downloads, `locale-food-nutrient-association-${randomUUID()}.csv`);
    await writeFile(inputFile, 'Wrong header\n'.repeat(262144));

    dbJob = await DbJob.create({
      type: 'LocaleFoodNutrientAssociation',
      userId: suite.data.system.user.id,
      params: { localeId: locale().id, mode: 'associate', file: inputFile, dryRun: true },
    });
    const bullJob = {
      id: `db-${dbJob.id}`,
      data: { params: dbJob.params },
      updateProgress: vi.fn(),
      returnvalue: null,
    } as unknown as BullJob;

    await expect(ioc.resolve('LocaleFoodNutrientAssociation').run(bullJob))
      .rejects
      .toThrow('Missing required CSV headers (Locale, Food code, FCT (NDB name), FCT record ID (NDB Food Code)).');
  });
};
