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
  NutrientTableCsvMapping,
  NutrientTableCsvMappingField,
  NutrientTableCsvMappingNutrient,
  NutrientTableRecord,
  NutrientTableRecordField,
  NutrientTableRecordNutrient,
} from '@intake24/db';

type DataJobParams = { nutrientTableId: string; file?: string };

function createMockBullJob(dbJobId: string, params: DataJobParams): BullJob {
  return ({
    id: `db-${dbJobId}`,
    data: { params },
    updateProgress: vi.fn(),
    returnvalue: null,
  }) as unknown as BullJob;
}

export default () => {
  let nutrientTable: NutrientTable | null = null;
  let record: NutrientTableRecord | null = null;
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
    if (record) {
      await NutrientTableRecordField.destroy({ where: { nutrientTableRecordId: record.id } });
      await NutrientTableRecordNutrient.destroy({ where: { nutrientTableRecordId: record.id } });
      await record.destroy();
    }
    if (nutrientTable) {
      await NutrientTableCsvMappingField.destroy({ where: { nutrientTableId: nutrientTable.id } });
      await NutrientTableCsvMappingNutrient.destroy({ where: { nutrientTableId: nutrientTable.id } });
      await NutrientTableCsvMapping.destroy({ where: { nutrientTableId: nutrientTable.id } });
      await nutrientTable.destroy();
    }

    nutrientTable = null;
    record = null;
    exportDbJob = null;
    importDbJob = null;
    exportedFile = null;
  });

  it('exports a header only when the row offset skips it, then the importer restores the data', async () => {
    const nutrientTableId = `data-${Date.now()}`;
    nutrientTable = await NutrientTable.create({
      id: nutrientTableId,
      description: 'Data export round-trip test',
    });
    await NutrientTableCsvMapping.create({
      nutrientTableId,
      rowOffset: 1,
      idColumnOffset: 0,
      descriptionColumnOffset: 2,
      localDescriptionColumnOffset: 3,
    });
    await NutrientTableCsvMappingField.create({ nutrientTableId, fieldName: 'Food group', columnOffset: 1 });

    const nutrientTypes = await FoodsNutrientType.findAll({
      where: { id: ['1', '2'] },
      attributes: ['id', 'description'],
      order: [['id', 'ASC']],
    });
    expect(nutrientTypes).toHaveLength(2);
    await NutrientTableCsvMappingNutrient.bulkCreate([
      { nutrientTableId, nutrientTypeId: nutrientTypes[0].id, columnOffset: 4 },
      { nutrientTableId, nutrientTypeId: nutrientTypes[1].id, columnOffset: 5 },
    ]);

    record = await NutrientTableRecord.create({
      nutrientTableId,
      nutrientTableRecordId: 'source-1',
      name: 'Source food',
      localName: 'Local food',
    });
    await NutrientTableRecordField.create({ nutrientTableRecordId: record.id, name: 'Food group', value: 'Vegetables' });
    await NutrientTableRecordNutrient.bulkCreate([
      { nutrientTableRecordId: record.id, nutrientTypeId: nutrientTypes[0].id, unitsPer100g: 12.3 },
      { nutrientTableRecordId: record.id, nutrientTypeId: nutrientTypes[1].id, unitsPer100g: 4.5 },
    ]);

    exportDbJob = await DbJob.create({
      type: 'NutrientTableDataExport',
      userId: suite.data.system.user.id,
      params: { nutrientTableId },
    });

    await NutrientTableCsvMapping.update({ rowOffset: 0 }, { where: { nutrientTableId } });
    await ioc.resolve('NutrientTableDataExport').run(createMockBullJob(exportDbJob.id, { nutrientTableId }));
    await exportDbJob.reload();

    expect(exportDbJob.downloadUrl).toBeTruthy();
    expect(exportDbJob.message).toBe('Nutrient table data export: exported 1 record with 6 CSV columns. No headers were included because rowOffset is 0.');
    const headerlessFile = path.resolve(ioc.cradle.fsConfig.local.downloads, exportDbJob.downloadUrl!);
    await expect(fs.readFile(headerlessFile, 'utf8')).resolves.toBe('source-1,Vegetables,Source food,Local food,12.3,4.5');
    await fs.rm(headerlessFile);

    await NutrientTableCsvMapping.update({ rowOffset: 1 }, { where: { nutrientTableId } });
    await ioc.resolve('NutrientTableDataExport').run(createMockBullJob(exportDbJob.id, { nutrientTableId }));
    await exportDbJob.reload();

    exportedFile = path.resolve(ioc.cradle.fsConfig.local.downloads, exportDbJob.downloadUrl!);
    expect(exportDbJob.message).toBe('Nutrient table data export: exported 1 record with 6 CSV columns.');
    await expect(fs.readFile(exportedFile, 'utf8')).resolves.toBe(
      `NDB food ID (FCT record ID),Food group,NDB food description,NDB local food description,${nutrientTypes[0].description},${nutrientTypes[1].description}\nsource-1,Vegetables,Source food,Local food,12.3,4.5`,
    );

    await record.update({ name: 'Changed food', localName: 'Changed local food' });
    await NutrientTableRecordField.update({ value: 'Changed' }, { where: { nutrientTableRecordId: record.id } });
    await NutrientTableRecordNutrient.update({ unitsPer100g: 99 }, { where: { nutrientTableRecordId: record.id } });

    importDbJob = await DbJob.create({
      type: 'NutrientTableDataImport',
      userId: suite.data.system.user.id,
      params: { nutrientTableId, file: exportedFile },
    });
    await ioc.resolve('NutrientTableDataImport').run(createMockBullJob(importDbJob.id, {
      nutrientTableId,
      file: exportedFile,
    }));

    await record.reload({ include: [{ association: 'fields' }, { association: 'nutrients' }] });
    expect(record.get({ plain: true })).toMatchObject({
      name: 'Source food',
      localName: 'Local food',
      fields: [{ name: 'Food group', value: 'Vegetables' }],
      nutrients: expect.arrayContaining([
        expect.objectContaining({ nutrientTypeId: nutrientTypes[0].id, unitsPer100g: 12.3 }),
        expect.objectContaining({ nutrientTypeId: nutrientTypes[1].id, unitsPer100g: 4.5 }),
      ]),
    });
  });
};
