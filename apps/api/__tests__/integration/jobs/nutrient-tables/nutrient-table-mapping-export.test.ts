import type { Job as BullJob } from 'bullmq';

import fs from 'node:fs/promises';
import path from 'node:path';

import { vi } from 'vitest';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import {
  Job as DbJob,
  FoodsNutrientType,
  NutrientTable,
  NutrientTableCsvMappingNutrient,
} from '@intake24/db';

type MappingJobParams = { nutrientTableId: string; file?: string };

function createMockBullJob(dbJobId: string, params: MappingJobParams): BullJob {
  return ({
    id: `db-${dbJobId}`,
    data: { params },
    updateProgress: vi.fn(),
    returnvalue: null,
  }) as unknown as BullJob;
}

export default () => {
  let nutrientTable: NutrientTable | null = null;
  let exportDbJob: DbJob | null = null;
  let importDbJob: DbJob | null = null;
  let exportedFile: string | null = null;

  afterEach(async () => {
    if (exportedFile)
      await fs.rm(exportedFile, { force: true });
    if (importDbJob)
      await importDbJob.destroy();
    if (exportDbJob)
      await exportDbJob.destroy();
    if (nutrientTable) {
      await NutrientTableCsvMappingNutrient.destroy({ where: { nutrientTableId: nutrientTable.id } });
      await nutrientTable.destroy();
    }

    nutrientTable = null;
    exportDbJob = null;
    importDbJob = null;
    exportedFile = null;
  });

  it('exports a mapping CSV that the mapping importer restores', async () => {
    const nutrientTableId = `mapping-${Date.now()}`;
    nutrientTable = await NutrientTable.create({
      id: nutrientTableId,
      description: 'Mapping export round-trip test',
    });

    const nutrientTypes = await FoodsNutrientType.findAll({
      where: { id: ['1', '2'] },
      attributes: ['id', 'description'],
      order: [['id', 'ASC']],
    });
    expect(nutrientTypes).toHaveLength(2);

    await NutrientTableCsvMappingNutrient.bulkCreate([
      { nutrientTableId, nutrientTypeId: nutrientTypes[0].id, columnOffset: 0 },
      { nutrientTableId, nutrientTypeId: nutrientTypes[1].id, columnOffset: 27 },
    ]);

    exportDbJob = await DbJob.create({
      type: 'NutrientTableMappingExport',
      userId: suite.data.system.user.id,
      params: { nutrientTableId },
    });
    await ioc.resolve('NutrientTableMappingExport').run(createMockBullJob(exportDbJob.id, { nutrientTableId }));
    await exportDbJob.reload();

    expect(exportDbJob.downloadUrl).toBeTruthy();
    exportedFile = path.resolve(ioc.cradle.fsConfig.local.downloads, exportDbJob.downloadUrl!);
    await expect(fs.readFile(exportedFile, 'utf8')).resolves.toContain(
      `\uFEFF"Intake24 nutrient ID","NDB spreadsheet column index","Nutrient name"\n"${nutrientTypes[0].id}","A","${nutrientTypes[0].description}"\n"${nutrientTypes[1].id}","AB","${nutrientTypes[1].description}"`,
    );

    importDbJob = await DbJob.create({
      type: 'NutrientTableMappingImport',
      userId: suite.data.system.user.id,
      params: { nutrientTableId, file: exportedFile },
    });
    await ioc.resolve('NutrientTableMappingImport').run(createMockBullJob(importDbJob.id, {
      nutrientTableId,
      file: exportedFile,
    }));

    const importedMappings = await NutrientTableCsvMappingNutrient.findAll({
      where: { nutrientTableId },
      attributes: ['nutrientTypeId', 'columnOffset'],
      order: [['columnOffset', 'ASC']],
    });
    expect(importedMappings.map(({ nutrientTypeId, columnOffset }) => ({ nutrientTypeId, columnOffset }))).toEqual([
      { nutrientTypeId: nutrientTypes[0].id, columnOffset: 0 },
      { nutrientTypeId: nutrientTypes[1].id, columnOffset: 27 },
    ]);
  });

  it('exports a header-only CSV when no mappings are configured', async () => {
    const nutrientTableId = `empty-mapping-${Date.now()}`;
    nutrientTable = await NutrientTable.create({
      id: nutrientTableId,
      description: 'Empty mapping export test',
    });
    exportDbJob = await DbJob.create({
      type: 'NutrientTableMappingExport',
      userId: suite.data.system.user.id,
      params: { nutrientTableId },
    });

    await ioc.resolve('NutrientTableMappingExport').run(createMockBullJob(exportDbJob.id, { nutrientTableId }));
    await exportDbJob.reload();

    expect(exportDbJob.message).toBe('Nutrient table mapping export: exported 0 records with 3 CSV columns.');
    exportedFile = path.resolve(ioc.cradle.fsConfig.local.downloads, exportDbJob.downloadUrl!);
    await expect(fs.readFile(exportedFile, 'utf8')).resolves.toBe(
      '\uFEFF"Intake24 nutrient ID","NDB spreadsheet column index","Nutrient name"',
    );
  });
};
