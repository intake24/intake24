// Batch nutrient validation command for pre-import checking
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';
import type { Logger } from '@intake24/common-backend/services/logger/logger';

interface ValidateNutrientsBatchOptions {
  inputPath: string;
  localeId: string;
  skipHeaderRows?: number;
  nutrientTableMapping?: Record<string, string>;
  reportPath?: string;
  dryRun?: boolean;
  skipInvalidNutrients?: boolean;
}

interface NutrientValidationResult {
  table: string;
  recordId: string;
  foodCode: string;
  foodName: string;
  valid: boolean;
  error?: string;
}

interface NutrientValidationReport {
  metadata: {
    startTime: Date;
    endTime?: Date;
    inputFile: string;
    localeId: string;
    totalRows: number;
    uniqueNutrientMappings: number;
  };
  summary: {
    totalValidated: number;
    valid: number;
    invalid: number;
    skipped: number;
    validationRate: number;
  };
  results: NutrientValidationResult[];
  missingTables: string[];
  missingRecords: Array<{
    table: string;
    recordId: string;
    foodCodes: string[];
  }>;
}

/**
 * Enhanced nutrient validation for batch processing
 */
export default async function validateNutrientsBatchCommand(
  options: ValidateNutrientsBatchOptions,
): Promise<void> {
  const logger = mainLogger.child({ service: 'Batch Nutrient Validation' });

  const resolvedOptions = {
    skipHeaderRows: options.skipHeaderRows ?? 2,
    nutrientTableMapping: options.nutrientTableMapping ?? {},
    dryRun: options.dryRun ?? false,
    skipInvalidNutrients: options.skipInvalidNutrients ?? false,
    reportPath: options.reportPath ?? '',
  };

  logger.info('🚀 Starting batch nutrient validation...');
  logger.info(`Input: ${options.inputPath}`);
  logger.info(`Locale: ${options.localeId}`);

  const report: NutrientValidationReport = {
    metadata: {
      startTime: new Date(),
      inputFile: options.inputPath,
      localeId: options.localeId,
      totalRows: 0,
      uniqueNutrientMappings: 0,
    },
    summary: {
      totalValidated: 0,
      valid: 0,
      invalid: 0,
      skipped: 0,
      validationRate: 0,
    },
    results: [],
    missingTables: [],
    missingRecords: [],
  };

  try {
    // Load and parse CSV
    const csvContent = readFileSync(resolve(options.inputPath), 'utf-8');
    const lines = csvContent.split(/\r?\n/);
    const dataLines = lines.slice(resolvedOptions.skipHeaderRows).filter(line => line.trim());

    report.metadata.totalRows = dataLines.length;
    logger.info(`📋 Found ${dataLines.length} food records to validate`);

    // Extract unique nutrient mappings
    const uniqueNutrientMappings = new Map<string, {
      table: string;
      recordId: string;
      foodCodes: string[];
      foodNames: string[];
    }>();

    for (const line of dataLines) {
      const fields = line.split(',').map(field => field.replace(/"/g, '').trim());

      if (fields.length < 16) {
        continue; // Skip malformed rows
      }

      const foodCode = fields[0];
      const englishDescription = fields[2];
      const localDescription = fields[3];
      const foodCompositionTable = fields[4];
      const foodCompositionRecordId = fields[5];

      // Skip rows with no nutrient information
      if (!foodCompositionTable || !foodCompositionRecordId
        || foodCompositionTable.trim() === '' || foodCompositionRecordId.trim() === ''
        || foodCompositionRecordId === 'N/A' || foodCompositionRecordId === '-') {
        continue;
      }

      // Apply nutrient table mapping
      const defaultMapping: Record<string, string> = {
        AUSNUT: 'AUSNUT',
        STFCJ: 'STFCJ',
        'DCD for Japan': 'DCDJapan',
        NDNS: 'NDNS',
        USDA: 'USDA',
        FCT: 'FCT',
        ...resolvedOptions.nutrientTableMapping,
      };

      const mappedTable = defaultMapping[foodCompositionTable] || foodCompositionTable;
      const key = `${mappedTable}:${foodCompositionRecordId}`;

      if (!uniqueNutrientMappings.has(key)) {
        uniqueNutrientMappings.set(key, {
          table: mappedTable,
          recordId: foodCompositionRecordId,
          foodCodes: [],
          foodNames: [],
        });
      }

      const mapping = uniqueNutrientMappings.get(key)!;
      mapping.foodCodes.push(foodCode);
      mapping.foodNames.push(localDescription || englishDescription);
    }

    report.metadata.uniqueNutrientMappings = uniqueNutrientMappings.size;
    logger.info(`🔍 Found ${uniqueNutrientMappings.size} unique nutrient mappings to validate`);

    if (resolvedOptions.dryRun) {
      logger.info('🔍 DRY RUN: Would validate the following nutrient mappings:');
      Array.from(uniqueNutrientMappings.values()).slice(0, 10).forEach((mapping) => {
        logger.info(`   ${mapping.table}/${mapping.recordId} (${mapping.foodCodes.length} foods)`);
      });
      if (uniqueNutrientMappings.size > 10) {
        logger.info(`   ... and ${uniqueNutrientMappings.size - 10} more mappings`);
      }
      return;
    }

    // Initialize API client
    const apiOptions = getApiClientV4EnvOptions();
    const apiClient = new ApiClientV4(logger, apiOptions);

    // Validate each unique nutrient mapping
    let processed = 0;
    for (const [_key, mapping] of uniqueNutrientMappings) {
      processed++;
      logger.info(`Validating ${processed}/${uniqueNutrientMappings.size}: ${mapping.table}/${mapping.recordId}`);

      try {
        await validateNutrientRecord(
          apiClient,
          mapping.table,
          mapping.recordId,
          mapping.foodCodes,
          mapping.foodNames,
          report,
          logger,
        );
      }
      catch (error) {
        logger.error(`Failed to validate ${mapping.table}/${mapping.recordId}: ${error}`);

        // Add to results as invalid
        for (let i = 0; i < mapping.foodCodes.length; i++) {
          report.results.push({
            table: mapping.table,
            recordId: mapping.recordId,
            foodCode: mapping.foodCodes[i],
            foodName: mapping.foodNames[i] || '',
            valid: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        report.summary.invalid += mapping.foodCodes.length;
      }
    }

    // Finalize report
    report.metadata.endTime = new Date();
    report.summary.totalValidated = report.results.length;
    report.summary.validationRate = report.summary.totalValidated > 0
      ? (report.summary.valid / report.summary.totalValidated) * 100
      : 0;

    // Generate report
    await generateValidationReport(report, resolvedOptions.reportPath, logger);

    // Print summary
    printValidationSummary(report, logger);

    if (report.summary.invalid > 0 && !resolvedOptions.skipInvalidNutrients) {
      throw new Error(`Validation failed: ${report.summary.invalid} invalid nutrient mappings found. Use --skip-invalid-nutrients to proceed anyway.`);
    }
  }
  catch (error) {
    logger.error(`Batch nutrient validation failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Validate a single nutrient record by attempting to create a test food
 */
async function validateNutrientRecord(
  apiClient: ApiClientV4,
  table: string,
  recordId: string,
  foodCodes: string[],
  foodNames: string[],
  report: NutrientValidationReport,
  logger: Logger,
): Promise<void> {
  const testFoodCode = `test_validate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Create minimal test global food
    const globalResult = await apiClient.foods.createGlobalFood({
      code: testFoodCode,
      name: 'Nutrient validation test food',
      foodGroupId: '1',
      attributes: {
        readyMealOption: false,
        sameAsBeforeOption: false,
        useInRecipes: 0,
      },
      parentCategories: [],
    });

    if (globalResult.type === 'conflict') {
      throw new Error('Failed to create test global food');
    }

    // Create test local food with nutrient mapping
    const localResult = await apiClient.foods.createLocalFood('jp_JP_2024', {
      code: testFoodCode,
      name: 'Nutrient validation test food',
      altNames: {},
      tags: ['validation-test'],
      nutrientTableCodes: {
        [table]: recordId,
      },
      portionSizeMethods: [],
      associatedFoods: [],
    }, {
      update: false,
      return: false,
    });

    if (localResult.type === 'conflict') {
      throw new Error('Failed to create test local food');
    }

    // Success - add all foods using this mapping as valid
    for (let i = 0; i < foodCodes.length; i++) {
      report.results.push({
        table,
        recordId,
        foodCode: foodCodes[i],
        foodName: foodNames[i] || '',
        valid: true,
      });
    }

    report.summary.valid += foodCodes.length;
    logger.debug(`✅ Valid: ${table}/${recordId} (${foodCodes.length} foods)`);
  }
  catch (error) {
    // Check if it's specifically a nutrient record not found error
    if (error instanceof Error && error.message.includes('Could not find food nutrient table record')) {
      // Add to missing records tracking
      report.missingRecords.push({
        table,
        recordId,
        foodCodes: [...foodCodes],
      });

      if (!report.missingTables.includes(table)) {
        report.missingTables.push(table);
      }
    }

    // Add all foods using this mapping as invalid
    for (let i = 0; i < foodCodes.length; i++) {
      report.results.push({
        table,
        recordId,
        foodCode: foodCodes[i],
        foodName: foodNames[i] || '',
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    report.summary.invalid += foodCodes.length;
    logger.warn(`❌ Invalid: ${table}/${recordId} (${foodCodes.length} foods) - ${error instanceof Error ? error.message : String(error)}`);
  }

  // Note: We don't clean up test foods to avoid API rate limits
  // They can be cleaned up manually or with a separate cleanup command
}

/**
 * Generate validation report
 */
async function generateValidationReport(
  report: NutrientValidationReport,
  reportPath: string,
  logger: Logger,
): Promise<void> {
  if (!reportPath) {
    reportPath = `nutrient-validation-report-${Date.now()}.json`;
  }

  try {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logger.info(`📄 Validation report saved: ${reportPath}`);
  }
  catch (error) {
    logger.warn(`Failed to save report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Print validation summary
 */
function printValidationSummary(report: NutrientValidationReport, logger: Logger): void {
  const duration = report.metadata.endTime
    ? report.metadata.endTime.getTime() - report.metadata.startTime.getTime()
    : 0;

  logger.info(`\n${'='.repeat(70)}`);
  logger.info('🎯 NUTRIENT VALIDATION SUMMARY');
  logger.info('='.repeat(70));
  logger.info(`Input file: ${report.metadata.inputFile}`);
  logger.info(`Total rows: ${report.metadata.totalRows}`);
  logger.info(`Unique nutrient mappings: ${report.metadata.uniqueNutrientMappings}`);
  logger.info(`Foods validated: ${report.summary.totalValidated}`);
  logger.info(`✅ Valid: ${report.summary.valid} (${report.summary.validationRate.toFixed(1)}%)`);
  logger.info(`❌ Invalid: ${report.summary.invalid}`);
  logger.info(`Duration: ${(duration / 1000).toFixed(1)}s`);

  if (report.missingTables.length > 0) {
    logger.info(`\n⚠️  Missing nutrient tables:`);
    report.missingTables.forEach(table => logger.info(`   ${table}`));
  }

  if (report.missingRecords.length > 0) {
    logger.info(`\n❌ Missing nutrient records (first 10):`);
    report.missingRecords.slice(0, 10).forEach((record) => {
      logger.info(`   ${record.table}/${record.recordId} (${record.foodCodes.length} foods affected)`);
    });
    if (report.missingRecords.length > 10) {
      logger.info(`   ... and ${report.missingRecords.length - 10} more missing records`);
    }
  }

  logger.info('='.repeat(70));
}
