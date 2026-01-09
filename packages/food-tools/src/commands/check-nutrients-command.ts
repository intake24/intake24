// Check nutrient table records command
import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';

interface CheckNutrientsOptions {
  table: string;
  recordId: string;
  dryRun?: boolean;
}

/**
 * Check if specific nutrient table records exist
 */
export default async function checkNutrientsCommand(options: CheckNutrientsOptions): Promise<void> {
  const logger = mainLogger.child({ service: 'Nutrient check' });

  logger.info(`Checking nutrient record: ${options.table}/${options.recordId}`);

  try {
    const apiOptions = getApiClientV4EnvOptions();
    const apiClient = new ApiClientV4(logger, apiOptions);

    // We'll need to make a test food creation to see if the nutrient record exists
    // Since there's no direct API to check nutrient table records
    logger.info('Creating test food to validate nutrient record...');

    if (options.dryRun) {
      logger.info('DRY RUN - Would test nutrient record validation');
      return;
    }

    // Try creating a minimal test food with the nutrient mapping
    const testFoodCode = `test_nutrient_${Date.now()}`;

    try {
      // First create a global food
      const globalResult = await apiClient.foods.createGlobalFood({
        code: testFoodCode,
        name: 'Test food for nutrient validation',
        foodGroupId: '1',
        attributes: {
          readyMealOption: false,
          sameAsBeforeOption: false,
          useInRecipes: 0,
        },
        parentCategories: [],
      });

      if (globalResult.type === 'conflict') {
        throw new Error('Test global food creation failed');
      }

      logger.info(`✅ Test global food created: ${testFoodCode}`);

      // Now try creating local food with nutrient mapping
      const localResult = await apiClient.foods.createLocalFood('jp_JP_2024', {
        code: testFoodCode,
        name: 'Test food for nutrient validation',
        altNames: {},
        tags: ['test'],
        nutrientTableCodes: {
          [options.table]: options.recordId,
        },
        portionSizeMethods: [],
        associatedFoods: [],
      }, {
        update: false,
        return: false,
      });

      if (localResult.type === 'conflict') {
        throw new Error('Test local food creation failed');
      }

      logger.info(`✅ SUCCESS: Nutrient record ${options.table}/${options.recordId} EXISTS and is valid!`);

      // Clean up test food
      logger.info('Cleaning up test food...');
      // Note: We can't delete via API, so we'll leave a note
      logger.warn(`⚠️  Please manually delete test food '${testFoodCode}' from admin interface`);
    }
    catch (error) {
      if (error instanceof Error && error.message.includes('Could not find food nutrient table record')) {
        logger.error(`❌ NUTRIENT RECORD NOT FOUND: ${options.table}/${options.recordId}`);
        logger.error('This nutrient record does not exist in the database');
      }
      else {
        logger.error(`❌ Error testing nutrient record: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    }
  }
  catch (error) {
    logger.error(`Nutrient check failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
