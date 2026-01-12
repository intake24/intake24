import type { PackageExportOptions } from './export-v3-command';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import type {
  ConflictResolutionStrategy,
  ImporterSpecificModulesExecutionStrategy,
} from '@intake24/cli/commands/packager/importer-v4';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';
import { ExporterV4 } from './exporter-v4';

export interface PackageImportOptions {
  asServed?: string[];
  locale?: string[];
  onConflict?: ConflictResolutionStrategy;
  modulesForExecution?: ImporterSpecificModulesExecutionStrategy[];
}

const TEMP_DIR_PREFIX = 'i24pkg-';

export default async (
  version: string,
  options: PackageExportOptions,
): Promise<void> => {
  const logger = mainLogger.child({ service: 'V4 packager' });

  const apiClient = new ApiClientV4(logger, getApiClientV4EnvOptions());

  const tempDirPath = await fs.mkdtemp(path.join(os.tmpdir(), TEMP_DIR_PREFIX));

  logger.debug(`Using temporary directory: ${tempDirPath}`);

  const exporter = new ExporterV4(apiClient, logger, tempDirPath);

  if (options.locale !== undefined)
    await exporter.addLocales(options.locale);

  await exporter.export();
};
