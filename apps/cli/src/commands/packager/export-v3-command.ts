import type { CredentialsV3 } from '@intake24/api-client-v3';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ApiClientV3 } from '@intake24/api-client-v3';
import { ExporterV3 } from '@intake24/cli/commands/packager/exporter-v3';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';

export interface PackageExportOptions {
  asServed?: string[];
  locale?: string[];
  skipFoods?: string[];
}

const TEMP_DIR_PREFIX = 'i24pkg-';

const DEFAULT_MAX_CONCURRENT_REQUESTS = 10;

function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (value === undefined)
    throw new Error(`Required environment variable ${key} is missing.`);

  return value;
}

export default async (version: string, options: PackageExportOptions): Promise<void> => {
  let credentials: CredentialsV3 | undefined;

  const username = process.env.V3_API_USERNAME;
  const password = process.env.V3_API_PASSWORD;

  if (username !== undefined && password !== undefined) {
    credentials = {
      username,
      password,
    };
  }

  const apiBaseUrl = getRequiredEnv('V3_API_BASE_URL');
  const refreshToken = process.env.V3_API_REFRESH_TOKEN;
  const maxConcurrentRequestsEnv = process.env.V3_API_MAX_CONCURRENT_REQUESTS;
  const maxConcurrentRequests
    = maxConcurrentRequestsEnv !== undefined
      ? Number.parseInt(maxConcurrentRequestsEnv)
      : DEFAULT_MAX_CONCURRENT_REQUESTS;

  const logger = mainLogger.child({ service: 'V3 packager' });

  const apiClient = new ApiClientV3(
    apiBaseUrl,
    logger,
    maxConcurrentRequests,
    refreshToken,
    credentials,
  );

  const tempDirPath = await fs.mkdtemp(path.join(os.tmpdir(), TEMP_DIR_PREFIX));

  logger.debug(`Using temporary directory: ${tempDirPath}`);

  const exporter = new ExporterV3(apiClient, logger, tempDirPath);

  if (options.skipFoods !== undefined)
    exporter.skipFoods(options.skipFoods);

  if (options.locale !== undefined)
    await exporter.addLocales(options.locale);

  if (options.asServed !== undefined)
    await exporter.addAsServedSets(options.asServed);

  await exporter.export();
};
