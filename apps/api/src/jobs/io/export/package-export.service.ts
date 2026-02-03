import type { IoC } from '@intake24/api/ioc';
import type { PackageExportOptions } from '@intake24/common/types/http/admin';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { InsufficientStorageError } from '@intake24/api/http/errors';
import { getTimestampedFileName } from '@intake24/api/util';
import { createUniqueEmptyFile, zipDirectory } from '@intake24/api/util/files';

import { PackageExporter } from './package-exporter';

export function createPackageExportService({
  kyselyDb,
  fsConfig,
  resolveDynamic,
  logger,
}: Pick<IoC, 'kyselyDb' | 'fsConfig' | 'resolveDynamic' | 'logger'>) {
  return async (options: PackageExportOptions, updateProgress: (progress: number) => Promise<void>): Promise<string> => {
    const tempDirPrefix = path.join(os.tmpdir(), 'i24pkg-');
    const tempDirPath = await fs.mkdtemp(tempDirPrefix);
    const imagesPath = path.join(tempDirPath, 'images');
    const log = logger.child({ service: 'PackageExport' });

    log.debug(`Package export temp path: ${tempDirPath}`);

    // Check low disk space threshold if images are being exported
    if (options.options.include.includes('portionSizeImages')) {
      const stats = await fs.statfs(tempDirPath);
      const freeSpace = stats.bavail * stats.bsize;

      if (freeSpace < fsConfig.lowDiskSpaceThreshold) {
        throw new InsufficientStorageError();
      }

      await fs.mkdir(imagesPath, { recursive: true });
    }

    const copyImage = async (relativePath: string): Promise<void> => {
      const source = path.join(fsConfig.local.images, relativePath);
      const dest = path.join(imagesPath, relativePath);

      try {
        await fs.copyFile(source, dest);
      }
      catch (err: any) {
        log.warn('Failed to copy image file', err);
      }
    };

    const packageWriter = await resolveDynamic(`packageWriter.${options.format}`)(tempDirPath, options);

    const exporter = new PackageExporter(kyselyDb.foods, packageWriter, options, tempDirPath, updateProgress, copyImage);

    await exporter.export();

    const fileName = getTimestampedFileName(`intake24-${options.locales.join('-').slice(0, 12)}`, 'zip');
    const uniqueFilePath = await createUniqueEmptyFile(path.join(fsConfig.local.downloads, fileName));

    await zipDirectory(tempDirPath, uniqueFilePath);

    // fs.unlink(tempDirPath)

    return path.relative(fsConfig.local.downloads, uniqueFilePath);
  };
}

export type PackageExportService = ReturnType<typeof createPackageExportService>;
