import type {
  ConflictResolutionStrategy,
  ImporterSpecificModulesExecutionStrategy,
} from '@intake24/cli/commands/packager/importer-v4';

import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { ImporterV4 } from '@intake24/cli/commands/packager/importer-v4';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';

export interface PackageImportOptions {
  asServedIds?: string[];
  foodIds?: string[];
  locale?: string[];
  onConflict?: ConflictResolutionStrategy;
  modulesForExecution?: ImporterSpecificModulesExecutionStrategy[];
  append: boolean;
}

export default async (
  version: string,
  inputFilePath: string,
  options: PackageImportOptions,
): Promise<void> => {
  const logger = mainLogger.child({ service: 'V4 packager' });

  const apiClient = new ApiClientV4(logger, getApiClientV4EnvOptions());

  const importer = new ImporterV4(apiClient, logger, inputFilePath, {
    append: options.append,
    onConflict: options.onConflict,
    modulesForExecution:
      options?.modulesForExecution !== undefined
        ? options.modulesForExecution
        : (['all'] as ImporterSpecificModulesExecutionStrategy[]),
    asServedIds: options.asServedIds,
    foodIds: options.foodIds,
  });

  await importer.import();
};
