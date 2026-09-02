import type { Job as BullJob } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, vi } from 'vitest';

import { Job as DbJob, NutrientTableCsvMappingNutrient } from '@intake24/db';

import NutrientTableMappingExport from './nutrient-table-mapping-export';

describe('nutrient table mapping export', () => {
  const downloads: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(downloads.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true })));
  });

  const createJob = async () => {
    const downloadsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nutrient-table-mapping-export-'));
    downloads.push(downloadsDir);

    const dbJob = { update: vi.fn().mockResolvedValue(undefined) };
    vi.spyOn(DbJob, 'findByPk').mockResolvedValue(dbJob as any);

    const logger = { child: vi.fn(), debug: vi.fn() };
    logger.child.mockReturnValue(logger);

    const job = new NutrientTableMappingExport({
      fsConfig: {
        local: {
          public: downloadsDir,
          downloads: downloadsDir,
          uploads: downloadsDir,
          images: downloadsDir,
          cache: downloadsDir,
        },
        urlExpiresAt: '60s',
        maxChunkedUploadSize: 1,
        lowDiskSpaceThreshold: 0,
      },
      logger: logger as unknown as Pick<IoC, 'logger'>['logger'],
    } as Pick<IoC, 'fsConfig' | 'logger'>);

    const bullJob = {
      id: 'db-1',
      data: { params: { nutrientTableId: 'FCT' } },
      updateProgress: vi.fn(),
    } as unknown as BullJob;

    return { dbJob, downloadsDir, job, bullJob };
  };

  it('exports a header-only CSV when the nutrient table has no configured mapping', async () => {
    vi.spyOn(NutrientTableCsvMappingNutrient, 'findAll').mockResolvedValue([] as any);
    const { dbJob, downloadsDir, job, bullJob } = await createJob();

    await expect(job.run(bullJob)).resolves.toBeUndefined();

    const update = dbJob.update.mock.calls[0][0];
    expect(update.message).toBe('Nutrient table mapping export: exported 0 records with 3 CSV columns.');
    const { downloadUrl } = update;
    await expect(fs.readFile(path.join(downloadsDir, downloadUrl), 'utf-8')).resolves.toBe(
      '\uFEFF"Intake24 nutrient ID","NDB spreadsheet column index","Nutrient name"',
    );
  });
});
