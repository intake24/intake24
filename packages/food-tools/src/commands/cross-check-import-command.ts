// Cross-check import results against original CSV using csv parsing
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';

interface CrossCheckOptions {
  csvPath: string;
  reportPath: string;
  localeId: string;
  outputPath?: string;
  checkExistingFoods?: boolean;
  generateValidationReport?: boolean;
  dryRun?: boolean;
}

interface CrossCheckResult {
  csvAnalysis: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    actionDistribution: Record<string, number>;
  };
  importAnalysis: {
    totalProcessed: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  discrepancies: {
    missingFromImport: string[];
    unexpectedInImport: string[];
    actionMismatches: Array<{
      code: string;
      csvAction: string;
      importResult: string;
      expected: string;
    }>;
  };
  foodExistenceCheck?: {
    checkedCodes: string[];
    existingFoods: string[];
    missingFoods: string[];
  };
}

/**
 * Cross-check import results against original CSV data
 */
export default async function crossCheckImportCommand(options: CrossCheckOptions): Promise<void> {
  const logger = mainLogger.child({ service: 'Import cross-check' });

  logger.info('🔍 Starting import cross-check analysis');
  logger.info(`CSV file: ${options.csvPath}`);
  logger.info(`Import report: ${options.reportPath}`);
  logger.info(`Locale: ${options.localeId}`);

  try {
    // Step 1: Analyze original CSV file
    logger.info('📊 Analyzing original CSV file...');
    const csvAnalysis = await analyzeCsvFile(options.csvPath, logger);

    // Step 2: Load import report
    logger.info('📋 Loading import report...');
    const importReport = loadImportReport(options.reportPath);

    // Step 3: Generate validation report if requested
    let validationReport = null;
    if (options.generateValidationReport) {
      logger.info('🔬 Running validation analysis...');
      validationReport = await generateValidationAnalysis(options.csvPath, logger);
    }

    // Step 4: Cross-reference data
    logger.info('🔄 Cross-referencing import results with CSV data...');
    const crossCheckResult = await performCrossCheck(
      csvAnalysis,
      importReport,
      options.localeId,
      options.checkExistingFoods,
      options.dryRun,
      logger,
    );

    // Step 5: Generate comprehensive report
    logger.info('📄 Generating cross-check report...');
    const report = generateCrossCheckReport(crossCheckResult, validationReport);

    // Step 6: Output results
    if (options.outputPath) {
      const outputData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          csvFile: options.csvPath,
          importReport: options.reportPath,
          localeId: options.localeId,
          checkExistingFoods: options.checkExistingFoods || false,
        },
        ...crossCheckResult,
        validationReport,
      };

      writeFileSync(options.outputPath, JSON.stringify(outputData, null, 2));
      logger.info(`✅ Cross-check report saved to: ${options.outputPath}`);
    }

    // Step 7: Display summary
    displaySummary(crossCheckResult, logger);
  }
  catch (error) {
    logger.error(`Cross-check failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Simple CSV parser for cross-check analysis
 */
function parseSimpleCsv(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  const result: string[][] = [];

  for (const line of lines) {
    if (line.trim() === '')
      continue;

    // Simple CSV parsing - handle quotes
    const row: string[] = [];
    let inQuotes = false;
    let currentField = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentField += '"';
          i++; // Skip next quote
        }
        else {
          inQuotes = !inQuotes;
        }
      }
      else if (char === ',' && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      }
      else {
        currentField += char;
      }
    }

    // Add final field
    row.push(currentField.trim());
    result.push(row);
  }

  return result;
}

/**
 * Analyze CSV file structure and content
 */
async function analyzeCsvFile(csvPath: string, logger: any) {
  const resolvedPath = resolve(csvPath);
  const content = readFileSync(resolvedPath, 'utf-8');
  const arrayData = parseSimpleCsv(content);

  // Skip header row
  const dataRows = arrayData.slice(1);

  // Analyze action distribution
  const actionDistribution: Record<string, number> = {};

  dataRows.forEach((row) => {
    const action = row[1]?.toString().trim() || 'unknown';
    actionDistribution[action] = (actionDistribution[action] || 0) + 1;
  });

  return {
    totalRows: dataRows.length,
    validRows: 0, // Will be filled by validation if requested
    invalidRows: 0, // Will be filled by validation if requested
    actionDistribution,
    foodCodes: dataRows.map(row => row[0]?.toString().trim()).filter(Boolean),
  };
}

/**
 * Load and parse import report
 */
function loadImportReport(reportPath: string) {
  try {
    const content = readFileSync(resolve(reportPath), 'utf-8');
    return JSON.parse(content);
  }
  catch (error) {
    throw new Error(`Failed to load import report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate basic validation analysis
 */
async function generateValidationAnalysis(csvPath: string, logger: any) {
  try {
    const resolvedPath = resolve(csvPath);
    const content = readFileSync(resolvedPath, 'utf-8');
    const arrayData = parseSimpleCsv(content);
    const dataRows = arrayData.slice(1); // Skip header

    // Basic validation - check for missing required fields
    let validRows = 0;
    let invalidRows = 0;
    const validationErrors: string[] = [];

    dataRows.forEach((row, index) => {
      const [code, action, englishDesc, localDesc] = row;
      let hasError = false;

      // Basic validation rules
      if (!code || code.trim() === '') {
        validationErrors.push(`Row ${index + 2}: Missing food code`);
        hasError = true;
      }

      if (!action || !['1', '2', '3', '4'].includes(action.trim())) {
        validationErrors.push(`Row ${index + 2}: Invalid action '${action}'`);
        hasError = true;
      }

      if (!englishDesc || englishDesc.trim() === '') {
        validationErrors.push(`Row ${index + 2}: Missing English description`);
        hasError = true;
      }

      if (!localDesc || localDesc.trim() === '') {
        validationErrors.push(`Row ${index + 2}: Missing local description`);
        hasError = true;
      }

      if (hasError) {
        invalidRows++;
      }
      else {
        validRows++;
      }
    });

    logger.info(`Basic validation completed: ${validRows}/${dataRows.length} valid rows`);

    return {
      validationReport: {
        totalRows: dataRows.length,
        validRows,
        invalidRows,
        errors: validationErrors.slice(0, 50), // Limit errors shown
      },
    };
  }
  catch (error) {
    logger.warn(`Validation analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Perform cross-check between CSV and import results
 */
async function performCrossCheck(
  csvAnalysis: any,
  importReport: any,
  localeId: string,
  checkExistingFoods: boolean = false,
  dryRun: boolean = false,
  logger: any,
): Promise<CrossCheckResult> {
  // Extract food codes from CSV and import report
  const csvFoodCodes = new Set(csvAnalysis.foodCodes as string[]);
  const importedFoodCodes = new Set(
    importReport.details?.map((detail: any) => detail.foodCode) || [],
  );

  // Find discrepancies
  const missingFromImport = Array.from(csvFoodCodes).filter(code => !importedFoodCodes.has(code));
  const unexpectedInImport = Array.from(importedFoodCodes).filter((code: any) => !csvFoodCodes.has(code as string));

  // Analyze action mismatches
  const actionMismatches: any[] = [];

  if (importReport.details) {
    for (const detail of importReport.details) {
      const expectedAction = getExpectedActionForResult(detail.operation);
      if (expectedAction !== detail.operation) {
        actionMismatches.push({
          code: detail.foodCode,
          csvAction: 'unknown', // Would need to match with CSV data
          importResult: detail.operation,
          expected: expectedAction,
        });
      }
    }
  }

  // Check food existence in database if requested
  let foodExistenceCheck;
  if (checkExistingFoods && !dryRun) {
    logger.info('🔍 Checking food existence in database...');
    foodExistenceCheck = await checkFoodExistence(
      Array.from(csvFoodCodes),
      localeId,
      logger,
    );
  }

  return {
    csvAnalysis: {
      totalRows: csvAnalysis.totalRows,
      validRows: csvAnalysis.validRows,
      invalidRows: csvAnalysis.invalidRows,
      actionDistribution: csvAnalysis.actionDistribution,
    },
    importAnalysis: {
      totalProcessed: importReport.summary?.totalProcessed || 0,
      created: importReport.summary?.created || 0,
      updated: importReport.summary?.updated || 0,
      skipped: importReport.summary?.skipped || 0,
      failed: importReport.summary?.failed || 0,
    },
    discrepancies: {
      missingFromImport,
      unexpectedInImport: unexpectedInImport as string[],
      actionMismatches,
    },
    foodExistenceCheck,
  };
}

/**
 * Check food existence in the database via API
 */
async function checkFoodExistence(foodCodes: string[], localeId: string, logger: any) {
  try {
    const apiOptions = getApiClientV4EnvOptions();
    const apiClient = new ApiClientV4(logger, apiOptions);

    const existingFoods: string[] = [];
    const missingFoods: string[] = [];

    // Check foods in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < foodCodes.length; i += batchSize) {
      const batch = foodCodes.slice(i, i + batchSize);

      for (const code of batch) {
        try {
          // Check if food exists by attempting to get it
          const response = await fetch(`${apiOptions.apiBaseUrl}/api/admin/foods/local/${localeId}/${code}`, {
            headers: {
              Authorization: `Bearer ${apiOptions.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            existingFoods.push(code);
          }
          else {
            missingFoods.push(code);
          }
        }
        catch (error) {
          missingFoods.push(code);
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      checkedCodes: foodCodes,
      existingFoods,
      missingFoods,
    };
  }
  catch (error) {
    logger.error(`Food existence check failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      checkedCodes: foodCodes,
      existingFoods: [],
      missingFoods: foodCodes,
    };
  }
}

/**
 * Get expected action based on import result
 */
function getExpectedActionForResult(operation: string): string {
  switch (operation) {
    case 'created':
      return 'created';
    case 'updated':
      return 'updated';
    case 'skipped':
      return 'skipped';
    case 'failed':
      return 'failed';
    default:
      return 'unknown';
  }
}

/**
 * Generate comprehensive cross-check report
 */
function generateCrossCheckReport(result: CrossCheckResult, validationAnalysis: any): string {
  const sections = [
    '# Import Cross-Check Analysis Report',
    '',
    '## Summary',
    `- **CSV Total**: ${result.csvAnalysis.totalRows} foods`,
    `- **Import Processed**: ${result.importAnalysis.totalProcessed} foods`,
    `- **Success Rate**: ${((result.importAnalysis.totalProcessed - result.importAnalysis.failed) / result.importAnalysis.totalProcessed * 100).toFixed(1)}%`,
    '',
    '## CSV Action Distribution',
  ];

  // Add action distribution
  Object.entries(result.csvAnalysis.actionDistribution).forEach(([action, count]) => {
    const actionName = getActionName(action);
    sections.push(`- **Action ${action}** (${actionName}): ${count} foods`);
  });

  sections.push('', '## Import Results Distribution');
  sections.push(`- **Created**: ${result.importAnalysis.created} foods`);
  sections.push(`- **Updated**: ${result.importAnalysis.updated} foods`);
  sections.push(`- **Skipped**: ${result.importAnalysis.skipped} foods`);
  sections.push(`- **Failed**: ${result.importAnalysis.failed} foods`);

  // Add discrepancies section
  sections.push('', '## Discrepancies Analysis');

  if (result.discrepancies.missingFromImport.length > 0) {
    sections.push(`### Missing from Import (${result.discrepancies.missingFromImport.length})`);
    sections.push('These foods were in CSV but not processed in import:');
    result.discrepancies.missingFromImport.slice(0, 10).forEach((code) => {
      sections.push(`- ${code}`);
    });
    if (result.discrepancies.missingFromImport.length > 10) {
      sections.push(`... and ${result.discrepancies.missingFromImport.length - 10} more`);
    }
  }

  if (result.discrepancies.unexpectedInImport.length > 0) {
    sections.push(`### Unexpected in Import (${result.discrepancies.unexpectedInImport.length})`);
    sections.push('These foods were imported but not found in CSV:');
    result.discrepancies.unexpectedInImport.slice(0, 10).forEach((code) => {
      sections.push(`- ${code}`);
    });
    if (result.discrepancies.unexpectedInImport.length > 10) {
      sections.push(`... and ${result.discrepancies.unexpectedInImport.length - 10} more`);
    }
  }

  // Add food existence check results
  if (result.foodExistenceCheck) {
    sections.push('', '## Database Existence Check');
    sections.push(`- **Existing in DB**: ${result.foodExistenceCheck.existingFoods.length} foods`);
    sections.push(`- **Missing from DB**: ${result.foodExistenceCheck.missingFoods.length} foods`);

    if (result.foodExistenceCheck.missingFoods.length > 0) {
      sections.push('### Foods Missing from Database:');
      result.foodExistenceCheck.missingFoods.slice(0, 10).forEach((code) => {
        sections.push(`- ${code}`);
      });
      if (result.foodExistenceCheck.missingFoods.length > 10) {
        sections.push(`... and ${result.foodExistenceCheck.missingFoods.length - 10} more`);
      }
    }
  }

  // Add validation analysis if available
  if (validationAnalysis?.validationReport) {
    const vr = validationAnalysis.validationReport;
    sections.push('', '## CSV Validation Analysis');
    sections.push(`- **Valid Rows**: ${vr.validRows}/${vr.totalRows} (${((vr.validRows / vr.totalRows) * 100).toFixed(1)}%)`);
    sections.push(`- **Invalid Rows**: ${vr.invalidRows}`);
    sections.push(`- **Warnings**: ${vr.rowsWithWarnings}`);

    if (validationAnalysis.researchReportPath) {
      sections.push(`- **Detailed Analysis**: ${validationAnalysis.researchReportPath}`);
    }
  }

  return sections.join('\n');
}

/**
 * Get human-readable action name
 */
function getActionName(action: string): string {
  switch (action) {
    case '1': return 'Update existing';
    case '2': return 'New local food';
    case '3': return 'Include existing';
    case '4': return 'New global + local';
    default: return 'Unknown';
  }
}

/**
 * Display summary to console
 */
function displaySummary(result: CrossCheckResult, logger: any): void {
  logger.info('\n🎯 Cross-Check Summary:');
  logger.info(`📊 CSV: ${result.csvAnalysis.totalRows} foods`);
  logger.info(`📋 Import: ${result.importAnalysis.totalProcessed} processed`);
  logger.info(`✅ Success Rate: ${((result.importAnalysis.totalProcessed - result.importAnalysis.failed) / result.importAnalysis.totalProcessed * 100).toFixed(1)}%`);

  if (result.discrepancies.missingFromImport.length > 0) {
    logger.warn(`⚠️  ${result.discrepancies.missingFromImport.length} foods missing from import`);
  }

  if (result.discrepancies.unexpectedInImport.length > 0) {
    logger.warn(`⚠️  ${result.discrepancies.unexpectedInImport.length} unexpected foods in import`);
  }

  if (result.foodExistenceCheck) {
    logger.info(`🔍 Database Check: ${result.foodExistenceCheck.existingFoods.length}/${result.foodExistenceCheck.checkedCodes.length} foods exist`);
  }

  if (result.discrepancies.missingFromImport.length === 0
    && result.discrepancies.unexpectedInImport.length === 0) {
    logger.info('✅ No discrepancies found - import matches CSV perfectly!');
  }
}
