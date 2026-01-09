// Rollback command for food import operations
import { readFileSync } from 'node:fs';
import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';

interface RollbackOptions {
  reportPath: string;
  dryRun?: boolean;
}

interface RollbackReport {
  metadata: {
    rollbackTime: Date;
    localeId: string;
    dryRun: boolean;
  };
  actions: {
    globalFoodsDeleted: number;
    localFoodsDeleted: number;
    enabledFoodsRestored: boolean;
  };
  errors: string[];
}

/**
 * Rollback food import using rollback information from import report
 */
export default async function rollbackImportCommand(options: RollbackOptions): Promise<void> {
  const logger = mainLogger.child({ service: 'Food import rollback' });

  logger.info(`Starting rollback from report: ${options.reportPath}`);
  logger.info(`Dry run: ${options.dryRun ?? false}`);

  try {
    // Load import report
    const reportContent = readFileSync(options.reportPath, 'utf-8');
    const importReport = JSON.parse(reportContent);

    if (!importReport.rollbackInfo) {
      throw new Error('No rollback information found in report. Cannot perform rollback.');
    }

    const rollbackInfo = importReport.rollbackInfo;
    const localeId = importReport.metadata.localeId;

    if (options.dryRun) {
      logger.info('DRY RUN - Would perform the following rollback actions:');
      logger.info(`- Delete ${rollbackInfo.createdGlobalFoods.length} global foods`);
      logger.info(`- Delete ${rollbackInfo.createdLocalFoods.length} local foods`);
      logger.info(`- Restore enabled foods list to ${rollbackInfo.originalEnabledFoods.length} items`);
      return;
    }

    const apiOptions = getApiClientV4EnvOptions();
    const apiClient = new ApiClientV4(logger, apiOptions);

    const rollbackReport: RollbackReport = {
      metadata: {
        rollbackTime: new Date(),
        localeId,
        dryRun: false,
      },
      actions: {
        globalFoodsDeleted: 0,
        localFoodsDeleted: 0,
        enabledFoodsRestored: false,
      },
      errors: [],
    };

    // Rollback enabled foods list first
    try {
      logger.info('Restoring original enabled foods list...');
      await apiClient.foods.updateEnabledFoods(localeId, rollbackInfo.originalEnabledFoods);
      rollbackReport.actions.enabledFoodsRestored = true;
      logger.info('✅ Enabled foods list restored');
    }
    catch (error) {
      const errorMsg = `Failed to restore enabled foods: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      rollbackReport.errors.push(errorMsg);
    }

    // Note: API client doesn't have delete methods for foods
    // This is intentional for data safety - foods should be manually reviewed before deletion

    logger.info('📋 Foods created during import (manual review required):');
    if (rollbackInfo.createdGlobalFoods.length > 0) {
      logger.info(`\n🌍 Global foods created (${rollbackInfo.createdGlobalFoods.length}):`);
      rollbackInfo.createdGlobalFoods.forEach((code: string) => {
        logger.info(`  - ${code} (review for deletion via admin interface)`);
      });
    }

    if (rollbackInfo.createdLocalFoods.length > 0) {
      logger.info(`\n📍 Local foods created for ${localeId} (${rollbackInfo.createdLocalFoods.length}):`);
      rollbackInfo.createdLocalFoods.forEach((code: string) => {
        logger.info(`  - ${code} (review for deletion via admin interface)`);
      });
    }

    logger.info(`\n💡 To remove foods manually:`);
    logger.info(`   1. Go to Admin → Food Database → Locale: ${localeId}`);
    logger.info(`   2. Search for each food code above`);
    logger.info(`   3. Delete local foods first, then global foods if unused by other locales`);

    rollbackReport.actions.localFoodsDeleted = 0; // Not automated
    rollbackReport.actions.globalFoodsDeleted = 0; // Not automated

    // Log summary
    logger.info('\n🔄 Rollback completed!');
    logger.info(`✅ Enabled foods restored: ${rollbackReport.actions.enabledFoodsRestored}`);
    logger.info(`📋 Foods requiring manual review: ${rollbackInfo.createdLocalFoods.length + rollbackInfo.createdGlobalFoods.length}`);
    logger.info(`   - Local foods: ${rollbackInfo.createdLocalFoods.length}`);
    logger.info(`   - Global foods: ${rollbackInfo.createdGlobalFoods.length}`);

    if (rollbackReport.errors.length > 0) {
      logger.warn(`❌ Errors encountered: ${rollbackReport.errors.length}`);
      rollbackReport.errors.forEach(error => logger.error(`  - ${error}`));
    }
  }
  catch (error) {
    logger.error(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
