// Generic food import CLI command for any locale
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';

import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';
import type { Logger } from '@intake24/common-backend/services/logger/logger';
import type { PortionSizeMethod, StandardUnit } from '@intake24/common/surveys/portion-size';
import type { UseInRecipeType } from '@intake24/common/types';
import { useInRecipeTypes } from '@intake24/common/types';
import type { CreateGlobalFoodRequest, CreateLocalFoodRequest, InheritableAttributes, UpdateGlobalFoodRequest } from '@intake24/common/types/http/admin';
import FoodCategoryLookupApiService from '../services/food-category-lookup-api.service';

// Constants
const CSV_CONSTANTS = {
  MIN_REQUIRED_COLUMNS: 16,
  DEFAULT_BATCH_SIZE: 25,
  DEFAULT_SKIP_HEADER_ROWS: 1,
  DEFAULT_FOOD_GROUP: '1',
  VALID_ACTIONS: ['1', '2', '3', '4'],
  BATCH_DELAY_MS: 50,
} as const;

export interface FoodImportOptions {
  inputPath: string;
  localeId: string;
  dryRun?: boolean;
  batchSize?: number;
  skipHeaderRows?: number;
  tags?: string[];
  defaultFoodGroup?: string;
  nutrientTableMapping?: Record<string, string>;
  skipExisting?: boolean;
  reportPath?: string;
  reportFormat?: 'csv' | 'json' | 'markdown';
  skipInvalidNutrients?: boolean;
  validateNutrients?: boolean;
  skipAssociatedFoods?: boolean;
  deleteAction1Local?: boolean;
}

interface FoodRow {
  intake24Code: string;
  action: string;
  englishDescription: string;
  localDescription: string;
  foodCompositionTable: string;
  foodCompositionRecordId: string;
  readyMealOption: string;
  sameAsBeforeOption: string;
  reasonableAmount: string;
  useInRecipes: string;
  associatedFood: string;
  brandNames: string;
  synonyms: string;
  brandNamesAsSearchTerms: string;
  portionSizeEstimationMethods: string;
  categories: string;
  milkInHotDrink: string;
  revisedLocalDescription: string;
}

type FoodOperation = 'created' | 'updated' | 'skipped' | 'failed';

interface AssociatedFoodIssue {
  associatedCode: string;
  reason: string;
  isLookupFailure: boolean;
}

interface ParseAssociatedFoodsResult {
  associatedFoods: any[];
  issues: AssociatedFoodIssue[];
}

interface ProcessLocalFoodResult {
  operation: FoodOperation;
  associatedFoodIssues: AssociatedFoodIssue[];
}

interface FoodImportResult {
  foodCode: string;
  englishDescription: string;
  localDescription: string;
  operation: FoodOperation;
  success: boolean;
  error?: string;
  timestamp: Date;
  associatedFoodIssues?: AssociatedFoodIssue[];
}

interface FoodImportReport {
  metadata: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    localeId: string;
    inputFile: string;
    skipExisting: boolean;
    dryRun: boolean;
    totalRows: number;
    backupTaken: boolean;
  };
  summary: {
    totalProcessed: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    successRate: number;
    deletedLocalFoods?: number;
    associatedFoodLookupFailures?: number;
    skippedAssociatedFoods?: number;
  };
  details: FoodImportResult[];
  rollbackInfo?: {
    createdGlobalFoods: string[];
    createdLocalFoods: string[];
    originalEnabledFoods: string[];
  };
  deletedLocalFoods?: Array<{ code: string; name: string }>;
  associatedFoodIssues?: Array<{ foodCode: string; associatedCode: string; reason: string; isLookupFailure: boolean }>;
}

/**
 * Input validation helpers
 */
function validateInputPath(inputPath: string): string {
  if (!inputPath) {
    throw new Error('Input path is required');
  }

  // Resolve to absolute path to prevent directory traversal
  const resolvedPath = resolve(inputPath);

  // Basic security check - ensure path doesn't contain suspicious patterns
  if (resolvedPath.includes('..') || resolvedPath.includes('~')) {
    throw new Error('Invalid input path - potential security risk');
  }

  return resolvedPath;
}

function validateOptions(options: FoodImportOptions): void {
  if (!options.localeId) {
    throw new Error('Locale ID is required');
  }

  if (options.batchSize && (options.batchSize < 1 || options.batchSize > 100)) {
    throw new Error('Batch size must be between 1 and 100');
  }

  if (options.skipHeaderRows && options.skipHeaderRows < 0) {
    throw new Error('Skip header rows must be non-negative');
  }
}

/**
 * Enhanced CSV parser with better error handling
 */
class CsvParser {
  static parse(
    content: string,
    skipHeaderRows: number,
  ): {
    records: Record<string, unknown>[];
    headerNames: string[];
    dataStartLine: number;
    categoryColumnKeys: string[];
  } {
    if (!content || content.trim() === '')
      throw new Error('CSV content is empty');

    const headerLineIndex = this.findHeaderLineIndex(content);
    const effectiveHeaderIndex = headerLineIndex >= 0 ? headerLineIndex : Math.max(skipHeaderRows - 1, 0);
    const fromLine = effectiveHeaderIndex + 1;
    const dataStartLine = effectiveHeaderIndex + 2; // 1-based line number of first data row

    let headerNames: string[] = [];
    let categoryColumnKeys: string[] = [];

    const records = parseCsv(content, {
      columns: (header: string[]) => {
        headerNames = this.normalizeHeaders(header);
        categoryColumnKeys = this.identifyCategoryColumns(header, headerNames);
        return headerNames;
      },
      from_line: fromLine,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
    }) as Record<string, unknown>[];

    return { records, headerNames, dataStartLine, categoryColumnKeys };
  }

  private static findHeaderLineIndex(content: string): number {
    const lines = content.split(/\r?\n/);
    return lines.findIndex(line => /intake24\s*code/i.test(line));
  }

  private static normalizeHeaders(headers: string[]): string[] {
    const seen = new Map<string, number>();

    return headers.map((header, index) => {
      const normalized = this.normalizeHeaderName(header);
      let candidate = normalized || `column_${index}`;

      const count = seen.get(candidate) ?? 0;
      if (count > 0)
        candidate = `${candidate}_${count + 1}`;
      seen.set(candidate, count + 1);

      return candidate;
    });
  }

  private static normalizeHeaderName(header: string): string {
    return header
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  private static identifyCategoryColumns(header: string[], normalized: string[]): string[] {
    const categoryKeys: string[] = [];
    let inCategorySection = false;

    header.forEach((original, index) => {
      const trimmed = original?.trim();
      const key = normalized[index];

      if (trimmed?.toLowerCase() === 'categories') {
        inCategorySection = true;
        categoryKeys.push(key);
        return;
      }

      if (inCategorySection && (!trimmed || trimmed.length === 0)) {
        categoryKeys.push(key);
        return;
      }

      if (inCategorySection) {
        inCategorySection = false;
      }
    });

    return categoryKeys;
  }
}

/**
 * Food import orchestrator - coordinates the entire import process
 */
class FoodImportOrchestrator {
  private logger: Logger;
  private apiClient: ApiClientV4;
  private options: Required<FoodImportOptions>;
  private report: FoodImportReport;
  private rollbackData: {
    createdGlobalFoods: string[];
    createdLocalFoods: string[];
    originalEnabledFoods: string[];
  };

  private validationSkips: FoodImportResult[];
  private categoryColumnKeys: string[];

  constructor(options: FoodImportOptions) {
    // Validate and normalize options
    validateOptions(options);

    this.options = {
      inputPath: validateInputPath(options.inputPath),
      localeId: options.localeId,
      dryRun: options.dryRun ?? false,
      batchSize: options.batchSize ?? CSV_CONSTANTS.DEFAULT_BATCH_SIZE,
      skipHeaderRows: options.skipHeaderRows ?? CSV_CONSTANTS.DEFAULT_SKIP_HEADER_ROWS,
      tags: options.tags ?? [],
      defaultFoodGroup: options.defaultFoodGroup ?? CSV_CONSTANTS.DEFAULT_FOOD_GROUP,
      nutrientTableMapping: options.nutrientTableMapping ?? {},
      skipExisting: options.skipExisting ?? false,
      reportPath: options.reportPath ?? '',
      reportFormat: options.reportFormat ?? 'json',
      skipInvalidNutrients: options.skipInvalidNutrients ?? true,
      validateNutrients: options.validateNutrients ?? false,
      skipAssociatedFoods: options.skipAssociatedFoods ?? false,
      deleteAction1Local: options.deleteAction1Local ?? false,
    };

    this.logger = mainLogger.child({ service: 'Food import' });

    const apiOptions = getApiClientV4EnvOptions();
    this.apiClient = new ApiClientV4(this.logger, apiOptions);

    this.rollbackData = {
      createdGlobalFoods: [],
      createdLocalFoods: [],
      originalEnabledFoods: [],
    };

    this.report = this.initializeReport();
    this.validationSkips = [];
    this.categoryColumnKeys = [];
  }

  private initializeReport(): FoodImportReport {
    return {
      metadata: {
        startTime: new Date(),
        localeId: this.options.localeId,
        inputFile: this.options.inputPath,
        skipExisting: this.options.skipExisting,
        dryRun: this.options.dryRun,
        totalRows: 0,
        backupTaken: false,
      },
      summary: {
        totalProcessed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        successRate: 0,
        associatedFoodLookupFailures: 0,
        skippedAssociatedFoods: 0,
      },
      details: [],
      associatedFoodIssues: [],
    };
  }

  async execute(): Promise<void> {
    this.logImportStart();

    try {
      // Step 1: Load and validate CSV data
      const foodRows = await this.loadAndValidateData();

      if (this.options.dryRun) {
        this.handleDryRun(foodRows);
        return;
      }

      // Step 2: Backup current state for rollback
      await this.backupCurrentState();

      // Step 3: Extract action 1 foods (to be excluded/removed)
      const action1Foods = foodRows
        .filter(food => food.action === '1')
        .map(food => food.intake24Code);

      if (action1Foods.length > 0) {
        this.logger.info(`Found ${action1Foods.length} action 1 foods to remove from enabled list`);
      }

      // Step 4: Process foods in batches
      const enabledFoodCodes = await this.processFoodsInBatches(foodRows);

      // Step 5: Update enabled foods list (add new foods and remove action 1 foods)
      await this.updateEnabledFoodsList(enabledFoodCodes, action1Foods);

      // Step 6: Delete local food records for action 1 foods if requested
      if (this.options.deleteAction1Local && action1Foods.length > 0) {
        await this.deleteLocalFoodsForAction1(action1Foods, foodRows);
      }

      // Step 7: Ensure category_locals exist for all categories used by foods in this locale
      await this.ensureLocalCategories();

      // Step 8: Finalize and generate report
      await this.finalizeReport();
    }
    catch (error) {
      this.logger.error('Import failed, checking if rollback is needed...');
      await this.handleImportError(error);
      throw error;
    }
  }

  private logImportStart(): void {
    this.logger.info(`Starting food list import from ${this.options.inputPath}`);
    this.logger.info(`Target locale: ${this.options.localeId}`);
    this.logger.info(`Dry run: ${this.options.dryRun}`);
    this.logger.info(`Skip existing: ${this.options.skipExisting}`);
    if (this.options.reportPath) {
      this.logger.info(`Report will be saved to: ${this.options.reportPath} (format: ${this.options.reportFormat})`);
    }
  }

  private async backupCurrentState(): Promise<void> {
    this.logger.info('Creating backup of current state for rollback capability...');

    try {
      // Backup enabled foods list
      const existingEnabledFoods = await this.apiClient.foods.getEnabledFoods(this.options.localeId);
      this.rollbackData.originalEnabledFoods = existingEnabledFoods?.enabledFoods || [];

      this.report.metadata.backupTaken = true;
      this.logger.info(`Backed up ${this.rollbackData.originalEnabledFoods.length} enabled foods for rollback`);
    }
    catch (error) {
      this.logger.warn(`Could not backup enabled foods: ${error instanceof Error ? error.message : String(error)}`);
      this.report.metadata.backupTaken = false;
    }
  }

  private async loadAndValidateData(): Promise<FoodRow[]> {
    this.logger.info('Reading and validating CSV file...');

    // Read CSV file with error handling
    let csvContent: string;
    try {
      csvContent = readFileSync(this.options.inputPath, { encoding: 'utf8' });
    }
    catch (error) {
      throw new Error(`Failed to read CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const { records, headerNames, dataStartLine, categoryColumnKeys } = CsvParser.parse(
      csvContent,
      this.options.skipHeaderRows,
    );

    this.logger.info(`CSV file contains ${records.length} data rows`);

    if (!records.length)
      throw new Error('CSV file must contain at least one data row');

    if (headerNames.length < CSV_CONSTANTS.MIN_REQUIRED_COLUMNS) {
      this.logger.warn(`Expected at least ${CSV_CONSTANTS.MIN_REQUIRED_COLUMNS} columns, found ${headerNames.length}`);
    }

    this.report.metadata.totalRows = records.length;
    this.categoryColumnKeys = categoryColumnKeys;

    // Process and validate data rows
    const foodRows = this.validateAndProcessRows(records, dataStartLine);

    this.appendValidationSkipsToReport();

    return foodRows;
  }

  private validateAndProcessRows(records: Record<string, unknown>[], dataStartLine: number): FoodRow[] {
    const foodRows: FoodRow[] = [];
    const validationErrors: string[] = [];

    this.logger.info(`Processing rows starting from line ${dataStartLine}`);

    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const rowNumber = dataStartLine + index;

      try {
        const foodRow = this.validateAndCreateFoodRow(record, rowNumber);
        if (foodRow) {
          foodRows.push(foodRow);
        }
      }
      catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        validationErrors.push(`Row ${rowNumber}: ${message}`);
        this.recordValidationSkip(record, rowNumber, message);
      }
    }

    if (validationErrors.length > 0) {
      this.logger.warn(`Skipped ${validationErrors.length} rows due to validation errors.`);
      validationErrors.slice(0, 10).forEach(error => this.logger.warn(error));
      if (validationErrors.length > 10)
        this.logger.warn(`... and ${validationErrors.length - 10} more errors`);
    }

    this.logger.info(`Successfully validated ${foodRows.length} food entries`);
    return foodRows;
  }

  private validateAndCreateFoodRow(record: Record<string, unknown>, rowNumber: number): FoodRow | null {
    const intake24Code = this.getColumnValue(record, ['intake24_code', 'code']);
    const action = this.getColumnValue(record, ['action']);
    const englishDescription = this.getColumnValue(record, ['english_description', 'description']);
    let localDescription = this.getColumnValue(record, ['local_description', 'local_name']);

    if (!intake24Code)
      throw new Error('Intake24 code is required');

    if (!action || !CSV_CONSTANTS.VALID_ACTIONS.includes(action as '1' | '2' | '3' | '4'))
      throw new Error(`Action must be 1, 2, 3, or 4 (got: "${action}")`);

    if (!englishDescription)
      throw new Error('English description is required');

    if (!localDescription) {
      this.logger.warn(`Row ${rowNumber}: Local description is missing, using English description`);
      localDescription = englishDescription;
    }

    return {
      intake24Code,
      action,
      englishDescription,
      localDescription,
      foodCompositionTable: this.getColumnValue(record, ['food_composition_table', 'source_database']),
      foodCompositionRecordId: this.getColumnValue(record, ['food_composition_record_id', 'food_composition_id', 'fct_record_id']),
      readyMealOption: this.getColumnValue(record, ['ready_meal_option']),
      sameAsBeforeOption: this.getColumnValue(record, ['same_as_before_option']),
      reasonableAmount: this.getColumnValue(record, ['reasonable_amount']),
      useInRecipes: this.getColumnValue(record, ['use_in_recipes']),
      associatedFood: this.getColumnValue(record, ['associated_food_category', 'associated_food', 'associated_food__category']),
      brandNames: this.getColumnValue(record, ['brand_names']),
      synonyms: this.getColumnValue(record, ['synonyms']),
      brandNamesAsSearchTerms: this.getColumnValue(record, ['brand_names_as_search_terms']),
      portionSizeEstimationMethods: this.getColumnValue(record, ['portion_size_estimation_methods']),
      categories: this.collectCategories(record).join(','),
      milkInHotDrink: this.getColumnValue(record, ['milk_in_a_hot_drink', 'milk_in_hot_drink']),
      revisedLocalDescription: this.getColumnValue(record, ['revised_local_description']),
    };
  }

  private getColumnValue(record: Record<string, unknown>, aliases: string[]): string {
    for (const alias of aliases) {
      const value = record[alias];
      if (value !== undefined && value !== null) {
        const stringValue = typeof value === 'string' ? value : String(value);
        const trimmedValue = stringValue.trim();
        if (trimmedValue.length > 0)
          return trimmedValue;
      }
    }

    return '';
  }

  private collectCategories(record: Record<string, unknown>): string[] {
    const values: string[] = [];
    const keys = this.categoryColumnKeys.length ? this.categoryColumnKeys : ['categories'];

    for (const key of keys) {
      const value = record[key];
      if (value === undefined || value === null)
        continue;

      const stringValue = typeof value === 'string' ? value : String(value);
      const trimmed = stringValue.trim();
      if (!trimmed)
        continue;

      if (trimmed.includes(',')) {
        trimmed.split(',').forEach((part) => {
          const token = part.trim();
          if (token)
            values.push(token);
        });
      }
      else {
        values.push(trimmed);
      }
    }

    return [...new Set(values)];
  }

  private recordValidationSkip(record: Record<string, unknown>, rowNumber: number, message: string): void {
    const foodCode = this.getColumnValue(record, ['intake24_code', 'code']) || `row-${rowNumber}`;
    const englishDescription = this.getColumnValue(record, ['english_description', 'description']);
    const localDescription = this.getColumnValue(record, ['local_description', 'local_name']) || englishDescription;

    this.validationSkips.push({
      foodCode,
      englishDescription,
      localDescription,
      operation: 'skipped',
      success: false,
      error: `Validation: ${message}`,
      timestamp: new Date(),
    });
  }

  private appendValidationSkipsToReport(): void {
    if (!this.validationSkips.length)
      return;

    this.validationSkips.forEach((skip) => {
      this.report.details.push(skip);
      this.report.summary.skipped++;
    });

    this.logger.warn(`Recorded ${this.validationSkips.length} skipped rows in the import report.`);
  }

  private handleDryRun(foodRows: FoodRow[]): void {
    this.logger.info('Dry run mode - would process the following foods:');
    foodRows.slice(0, 5).forEach((food) => {
      this.logger.info(`  ${food.intake24Code}: ${food.englishDescription} / ${food.localDescription}`);
    });
    if (foodRows.length > 5) {
      this.logger.info(`... and ${foodRows.length - 5} more foods`);
    }
  }

  private async processFoodsInBatches(foodRows: FoodRow[]): Promise<string[]> {
    this.logger.info(`Processing ${foodRows.length} foods in batches of ${this.options.batchSize}...`);

    const enabledFoodCodes: string[] = [];
    const totalBatches = Math.ceil(foodRows.length / this.options.batchSize);

    for (let i = 0; i < foodRows.length; i += this.options.batchSize) {
      const batch = foodRows.slice(i, i + this.options.batchSize);
      const batchNumber = Math.floor(i / this.options.batchSize) + 1;

      this.logger.info(`Processing batch ${batchNumber}/${totalBatches}`);

      const batchResults = await this.processBatch(batch);

      // Collect enabled food codes
      batchResults.forEach((result, index) => {
        if (result.success && (result.operation === 'created' || result.operation === 'updated')) {
          enabledFoodCodes.push(batch[index].intake24Code);
        }
      });

      // Rate limiting between batches
      if (i + this.options.batchSize < foodRows.length) {
        await new Promise(resolve => setTimeout(resolve, CSV_CONSTANTS.BATCH_DELAY_MS));
      }
    }

    return enabledFoodCodes;
  }

  private async processBatch(batch: FoodRow[]): Promise<FoodImportResult[]> {
    const batchResults = await Promise.all(batch.map(async (food) => {
      const result = await FoodProcessor.process(food, this.options.localeId, this.apiClient, this.logger, {
        tags: this.options.tags,
        defaultFoodGroup: this.options.defaultFoodGroup,
        nutrientTableMapping: this.options.nutrientTableMapping,
        skipExisting: this.options.skipExisting,
        skipInvalidNutrients: this.options.skipInvalidNutrients,
        skipAssociatedFoods: this.options.skipAssociatedFoods,
      }, this.rollbackData);

      // Update report
      this.updateReportWithResult(result);

      return result;
    }));

    return batchResults;
  }

  private updateReportWithResult(result: FoodImportResult): void {
    this.report.details.push(result);
    this.report.summary.totalProcessed++;

    if (result.success) {
      switch (result.operation) {
        case 'created':
          this.report.summary.created++;
          break;
        case 'updated':
          this.report.summary.updated++;
          break;
        case 'skipped':
          this.report.summary.skipped++;
          break;
      }
    }
    else {
      this.report.summary.failed++;
    }

    // Collect associated food issues
    if (result.associatedFoodIssues && result.associatedFoodIssues.length > 0) {
      for (const issue of result.associatedFoodIssues) {
        this.report.associatedFoodIssues!.push({
          foodCode: result.foodCode,
          associatedCode: issue.associatedCode,
          reason: issue.reason,
          isLookupFailure: issue.isLookupFailure,
        });

        // Update summary counters
        if (issue.isLookupFailure) {
          this.report.summary.associatedFoodLookupFailures!++;
        }
        else {
          this.report.summary.skippedAssociatedFoods!++;
        }
      }
    }
  }

  private async updateEnabledFoodsList(enabledFoodCodes: string[], action1Foods: string[] = []): Promise<void> {
    this.logger.info(`Updating enabled foods list...`);
    this.logger.info(`  - Adding: ${enabledFoodCodes.length} foods`);
    this.logger.info(`  - Removing: ${action1Foods.length} action 1 foods`);

    try {
      const existingEnabledFoods = await this.apiClient.foods.getEnabledFoods(this.options.localeId);
      const currentEnabled = existingEnabledFoods?.enabledFoods || [];

      // Create a Set for efficient operations
      const updatedEnabledSet = new Set(currentEnabled);

      // Add new enabled foods
      enabledFoodCodes.forEach(code => updatedEnabledSet.add(code));

      // Remove action 1 foods
      let removedCount = 0;
      action1Foods.forEach((code) => {
        if (updatedEnabledSet.has(code)) {
          updatedEnabledSet.delete(code);
          removedCount++;
          this.logger.debug(`Removed action 1 food from enabled list: ${code}`);
        }
      });

      const updatedEnabled = Array.from(updatedEnabledSet);

      await this.apiClient.foods.updateEnabledFoods(this.options.localeId, updatedEnabled);
      this.logger.info(`Successfully updated enabled foods list (added: ${enabledFoodCodes.length}, removed: ${removedCount}, total: ${updatedEnabled.length})`);
    }
    catch (error) {
      this.logger.error(`Failed to update enabled foods list: ${error instanceof Error ? error.message : String(error)}`);
      throw error; // Re-throw to handle in main error handler
    }
  }

  /**
   * Delete local food records for action 1 foods
   * This removes them from the admin tree view for this locale
   * Processes deletions in parallel batches for better performance
   */
  private async deleteLocalFoodsForAction1(action1FoodCodes: string[], allFoodRows: FoodRow[]): Promise<void> {
    this.logger.info(`Deleting local food records for ${action1FoodCodes.length} action 1 foods...`);

    // Pre-compute food name map for O(1) lookups instead of O(n) for each deletion
    const foodNameMap = new Map<string, string>();
    allFoodRows.forEach((row) => {
      foodNameMap.set(row.intake24Code, row.englishDescription);
    });

    const deletedFoods: Array<{ code: string; name: string }> = [];
    let deletedCount = 0;
    let notFoundCount = 0;
    let failedCount = 0;

    // Process deletions in batches like main import for better performance
    const totalBatches = Math.ceil(action1FoodCodes.length / this.options.batchSize);

    for (let i = 0; i < action1FoodCodes.length; i += this.options.batchSize) {
      const batch = action1FoodCodes.slice(i, i + this.options.batchSize);
      const batchNumber = Math.floor(i / this.options.batchSize) + 1;

      this.logger.info(`Deleting batch ${batchNumber}/${totalBatches}`);

      // Process batch deletions in parallel
      const batchResults = await Promise.all(
        batch.map(async (foodCode) => {
          try {
            const foodName = foodNameMap.get(foodCode) || foodCode;

            // Delete the local food record
            await this.apiClient.foods.deleteLocalFood(this.options.localeId, foodCode);

            this.logger.debug(`Deleted local food: ${foodCode} (${foodName})`);
            return { success: true, code: foodCode, name: foodName, reason: 'deleted' };
          }
          catch (error: any) {
            if (error?.status === 404) {
              // Local food doesn't exist - this is fine
              this.logger.debug(`Local food not found (already deleted): ${foodCode}`);
              return { success: true, code: foodCode, name: foodNameMap.get(foodCode) || foodCode, reason: 'not_found' };
            }
            else {
              this.logger.error(`Failed to delete local food ${foodCode}: ${error instanceof Error ? error.message : String(error)}`);
              return { success: false, code: foodCode, name: foodNameMap.get(foodCode) || foodCode, reason: 'error' };
            }
          }
        }),
      );

      // Aggregate batch results
      batchResults.forEach((result) => {
        if (result.success) {
          if (result.reason === 'deleted') {
            deletedCount++;
            deletedFoods.push({ code: result.code, name: result.name });
          }
          else if (result.reason === 'not_found') {
            notFoundCount++;
          }
        }
        else {
          failedCount++;
        }
      });

      // Rate limiting between batches (same as main import)
      if (i + this.options.batchSize < action1FoodCodes.length) {
        await new Promise(resolve => setTimeout(resolve, CSV_CONSTANTS.BATCH_DELAY_MS));
      }
    }

    // Store deleted foods in report
    this.report.deletedLocalFoods = deletedFoods;
    this.report.summary.deletedLocalFoods = deletedCount;

    this.logger.info(`Local food deletion complete: ${deletedCount} deleted, ${notFoundCount} already removed, ${failedCount} failed`);
  }

  /**
   * Ensures that category_locals exist for all categories used by foods in this locale.
   * This is required for the admin UI tree view to display category groupings.
   */
  private async ensureLocalCategories(): Promise<void> {
    this.logger.info('Ensuring category_locals exist for all categories used in this locale...');

    try {
      // Get all enabled foods for this locale
      const enabledFoodsResponse = await this.apiClient.foods.getEnabledFoods(this.options.localeId);
      const enabledFoods = enabledFoodsResponse?.enabledFoods || [];

      if (enabledFoods.length === 0) {
        this.logger.info('No enabled foods found - skipping category_locals creation');
        return;
      }

      this.logger.debug(`Analyzing ${enabledFoods.length} enabled foods to extract categories...`);

      // Collect all unique category codes from global foods
      const categoryCodes = new Set<string>();
      const batchSize = 50; // Process foods in batches to avoid overwhelming the API

      for (let i = 0; i < enabledFoods.length; i += batchSize) {
        const batch = enabledFoods.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(enabledFoods.length / batchSize);

        this.logger.debug(`Processing category extraction batch ${batchNumber}/${totalBatches}`);

        // Fetch global food details for each food in the batch
        const globalFoodPromises = batch.map(async (foodCode) => {
          try {
            const globalFood = await this.apiClient.foods.findGlobalFood(foodCode);
            return globalFood?.parentCategories || [];
          }
          catch (error: any) {
            // Silently skip foods that don't exist or have errors
            if (error?.status !== 404) {
              this.logger.debug(`Could not fetch categories for ${foodCode}: ${error?.message || 'Unknown error'}`);
            }
            return [];
          }
        });

        const batchCategories = await Promise.all(globalFoodPromises);

        // Add all category codes to the set
        batchCategories.flat().forEach((category: any) => {
          if (category?.code) {
            categoryCodes.add(category.code);
          }
        });

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < enabledFoods.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      if (categoryCodes.size === 0) {
        this.logger.info('No categories found for foods in this locale');
        return;
      }

      this.logger.info(`Found ${categoryCodes.size} unique categories used by foods in this locale`);

      // Check which category_locals already exist
      // Note: This requires either an API endpoint or direct database access
      // For now, we'll attempt to create all and rely on database constraints to prevent duplicates
      this.logger.info(`Creating category_locals entries for ${categoryCodes.size} categories...`);

      // Check if API client has a method to create category_locals
      // If not, we'll need to log instructions for manual creation
      if (typeof (this.apiClient as any).categories?.createLocalCategory === 'function') {
        // API method exists - use it
        let created = 0;
        let skipped = 0;

        for (const categoryCode of categoryCodes) {
          try {
            await (this.apiClient as any).categories.createLocalCategory(this.options.localeId, {
              categoryCode,
              // The API should fetch the global category details and create the local entry
            });
            created++;
          }
          catch (error: any) {
            if (error?.status === 409) {
              // Conflict - category_local already exists
              skipped++;
            }
            else {
              this.logger.warn(`Failed to create category_local for ${categoryCode}: ${error?.message || 'Unknown error'}`);
            }
          }
        }

        this.logger.info(`Category_locals creation complete: ${created} created, ${skipped} already existed`);
      }
      else {
        // API method doesn't exist - provide manual instructions
        this.logger.warn('API method for creating category_locals not available');
        this.logger.warn('You may need to create category_locals entries manually using the following SQL:');
        this.logger.warn('');
        this.logger.warn(`INSERT INTO category_locals (category_code, locale_id, name, simple_name, version, tags)`);
        this.logger.warn(`SELECT c.code, '${this.options.localeId}', c.name, c.name, gen_random_uuid(), ARRAY[]::varchar[]`);
        this.logger.warn(`FROM categories c`);
        this.logger.warn(`WHERE c.code IN (${[...categoryCodes].map(c => `'${c}'`).join(', ')})`);
        this.logger.warn(`ON CONFLICT (category_code, locale_id) DO NOTHING;`);
        this.logger.warn('');
        this.logger.warn('This will ensure categories are visible in the admin UI tree view.');
      }
    }
    catch (error) {
      // Log error but don't fail the entire import
      this.logger.error(`Failed to ensure category_locals: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.warn('Import completed successfully, but category_locals may need to be created manually');
    }
  }

  private async finalizeReport(): Promise<void> {
    const endTime = new Date();
    this.report.metadata.endTime = endTime;
    this.report.metadata.duration = endTime.getTime() - this.report.metadata.startTime.getTime();
    this.report.summary.successRate = this.report.summary.totalProcessed > 0
      ? ((this.report.summary.totalProcessed - this.report.summary.failed) / this.report.summary.totalProcessed) * 100
      : 0;

    // Add rollback information to report
    this.report.rollbackInfo = {
      createdGlobalFoods: [...this.rollbackData.createdGlobalFoods],
      createdLocalFoods: [...this.rollbackData.createdLocalFoods],
      originalEnabledFoods: [...this.rollbackData.originalEnabledFoods],
    };

    this.logImportSummary();

    // Generate report if requested
    if (this.options.reportPath && !this.options.dryRun) {
      await this.generateReport();
    }
  }

  private logImportSummary(): void {
    this.logger.info('Import completed!');
    this.logger.info(`Total processed: ${this.report.summary.totalProcessed}`);
    this.logger.info(`Created: ${this.report.summary.created}`);
    this.logger.info(`Updated: ${this.report.summary.updated}`);
    this.logger.info(`Skipped: ${this.report.summary.skipped}`);
    this.logger.info(`Failed: ${this.report.summary.failed}`);
    this.logger.info(`Success rate: ${this.report.summary.successRate.toFixed(2)}%`);
  }

  private async generateReport(): Promise<void> {
    this.logger.info(`Generating ${this.options.reportFormat} report...`);
    await ReportGenerator.generate(this.report, this.options.reportFormat, this.options.reportPath!);
    this.logger.info(`Report saved to: ${this.options.reportPath}`);
  }

  private async handleImportError(error: unknown): Promise<void> {
    this.logger.error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);

    // Save partial report if possible
    if (this.options.reportPath && this.report.summary.totalProcessed > 0) {
      const endTime = new Date();
      this.report.metadata.endTime = endTime;
      this.report.metadata.duration = endTime.getTime() - this.report.metadata.startTime.getTime();
      this.report.summary.successRate = this.report.summary.totalProcessed > 0
        ? ((this.report.summary.totalProcessed - this.report.summary.failed) / this.report.summary.totalProcessed) * 100
        : 0;

      try {
        await ReportGenerator.generate(this.report, this.options.reportFormat, this.options.reportPath);
        this.logger.info(`Partial report saved to: ${this.options.reportPath}`);
      }
      catch (reportError) {
        this.logger.error(`Failed to save report: ${reportError instanceof Error ? reportError.message : String(reportError)}`);
      }
    }
  }
}

/**
 * Extracted food processing logic
 */
class FoodProcessor {
  static async process(
    food: FoodRow,
    localeId: string,
    apiClient: ApiClientV4,
    logger: Logger,
    config: {
      tags: string[];
      defaultFoodGroup: string;
      nutrientTableMapping: Record<string, string>;
      skipExisting: boolean;
      skipInvalidNutrients: boolean;
      skipAssociatedFoods: boolean;
    },
    rollbackData?: {
      createdGlobalFoods: string[];
      createdLocalFoods: string[];
    },
  ): Promise<FoodImportResult> {
    const { intake24Code, action } = food;

    // Parse action: 1=update, 2=new local, 3=include existing, 4=new global+local
    const actionNum = Number.parseInt(action, 10);

    // Skip action 1 foods entirely
    if (actionNum === 1) {
      logger.debug(`Skipping action 1 food: ${intake24Code}`);
      return FoodProcessor.createResult(food, 'skipped', true);
    }

    try {
      const actionFlags = FoodProcessor.parseActionFlags(actionNum);

      // Handle global food creation
      if (actionFlags.shouldCreateGlobal) {
        const globalCreated = await FoodProcessor.ensureGlobalFood(food, apiClient, logger, config);
        if (globalCreated && rollbackData) {
          rollbackData.createdGlobalFoods.push(intake24Code);
        }
      }

      // Handle category update for existing global foods (action 3)
      if (actionFlags.shouldUpdateGlobalCategories) {
        await FoodProcessor.updateGlobalFoodCategories(food, apiClient, logger);
      }

      // Handle local food creation/update
      if (actionFlags.shouldCreateLocal || actionFlags.shouldInclude) {
        const localResult = await FoodProcessor.processLocalFood(food, localeId, apiClient, logger, config);
        if ((localResult.operation === 'created' || localResult.operation === 'updated') && rollbackData) {
          rollbackData.createdLocalFoods.push(intake24Code);
        }
        return FoodProcessor.createResult(food, localResult.operation, true, undefined, localResult.associatedFoodIssues);
      }

      // If we only created global food
      return FoodProcessor.createResult(food, 'created', true);
    }
    catch (error) {
      const detail = (error as any)?.detail;
      let errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      if ((!errorMessage || !errorMessage.trim()) && detail !== undefined) {
        if (typeof detail === 'string' && detail.trim().length > 0) {
          errorMessage = detail;
        }
        else {
          try {
            errorMessage = JSON.stringify(detail);
          }
          catch {
            errorMessage = String(detail);
          }
        }
      }

      if (!errorMessage || !errorMessage.trim()) {
        if (error instanceof Error) {
          const code = (error as any)?.code;
          const name = error.name ?? 'Error';
          errorMessage = `${name}${code ? ` [${code}]` : ''}`;
        }
        else {
          errorMessage = String(error ?? 'Unknown error');
        }
      }

      if (!errorMessage || !errorMessage.trim())
        errorMessage = 'Unknown error';
      logger.error(
        `Failed to process food ${intake24Code}: ${errorMessage}`,
        { detail: detail ?? error },
      );
      return FoodProcessor.createResult(food, 'failed', false, errorMessage || 'Unknown error');
    }
  }

  private static parseActionFlags(actionNum: number) {
    return {
      shouldCreateGlobal: actionNum === 4, // Only Action 4 creates global food
      shouldCreateLocal: actionNum === 2 || actionNum === 4, // Actions 2 & 4 create local food
      shouldInclude: actionNum === 3 || actionNum === 4, // Actions 3 & 4 include in locale
      shouldUpdateGlobalCategories: actionNum === 2 || actionNum === 3, // Actions 2 & 3 should update existing global food categories
    };
  }

  private static createResult(
    food: FoodRow,
    operation: FoodOperation,
    success: boolean,
    error?: string,
    associatedFoodIssues?: AssociatedFoodIssue[],
  ): FoodImportResult {
    const normalizedError = error?.trim();
    return {
      foodCode: food.intake24Code,
      englishDescription: food.englishDescription,
      localDescription: food.localDescription || food.englishDescription,
      operation,
      success,
      error: success
        ? ''
        : normalizedError && normalizedError.length > 0
          ? normalizedError
          : 'Unknown error',
      timestamp: new Date(),
      associatedFoodIssues: associatedFoodIssues && associatedFoodIssues.length > 0 ? associatedFoodIssues : undefined,
    };
  }

  // Update categories for existing global food (action 3)
  private static async updateGlobalFoodCategories(
    food: FoodRow,
    apiClient: ApiClientV4,
    logger: Logger,
  ): Promise<void> {
    let existingGlobalFood: Awaited<ReturnType<typeof apiClient.foods.findGlobalFood>> | null = null;

    try {
      existingGlobalFood = await apiClient.foods.findGlobalFood(food.intake24Code);
    }
    catch (error: any) {
      if (error?.status === 404) {
        existingGlobalFood = null;
      }
      else {
        logger.error(
          `Failed to look up global food ${food.intake24Code}: ${error instanceof Error ? error.message : String(error)}`,
          { detail: (error as any)?.detail ?? error },
        );
        throw error;
      }
    }
    if (!existingGlobalFood) {
      logger.warn(`Cannot update categories for non-existent global food: ${food.intake24Code}`);
      return;
    }

    // Check if name has changed
    const csvName = food.englishDescription?.trim() || '';
    const dbName = existingGlobalFood.name?.trim() || '';
    const nameChanged = csvName.length > 0 && csvName !== dbName;

    // Check if categories have changed
    const categories = food.categories?.trim()
      ? FoodDataParser.parseCategories(food.categories)
      : [];
    const existingCategories = existingGlobalFood.parentCategories?.map((c: any) => c.code) || [];
    const categoriesChanged = categories.length > 0
      && (categories.length !== existingCategories.length
        || !categories.every(cat => existingCategories.includes(cat)));

    // Only update if something changed
    if (nameChanged || categoriesChanged) {
      // Map attributes to ensure type compatibility
      const attributes: InheritableAttributes = existingGlobalFood.attributes
        ? {
            readyMealOption: existingGlobalFood.attributes.readyMealOption ?? undefined,
            sameAsBeforeOption: existingGlobalFood.attributes.sameAsBeforeOption ?? undefined,
            reasonableAmount: existingGlobalFood.attributes.reasonableAmount ?? undefined,
            useInRecipes: existingGlobalFood.attributes.useInRecipes ?? undefined,
          }
        : {};

      const updateRequest: UpdateGlobalFoodRequest = {
        name: csvName || existingGlobalFood.name,
        foodGroupId: existingGlobalFood.foodGroupId,
        attributes,
        parentCategories: categories.length > 0 ? categories : existingCategories,
      };

      await apiClient.foods.updateGlobalFood(
        food.intake24Code,
        existingGlobalFood.version,
        updateRequest,
      );

      const changes: string[] = [];
      if (nameChanged)
        changes.push('name');
      if (categoriesChanged)
        changes.push('categories');
      logger.debug(`Updated ${changes.join(', ')} for global food: ${food.intake24Code}`);
    }
  }

  // Continue with existing global and local food processing methods...
  private static async ensureGlobalFood(
    food: FoodRow,
    apiClient: ApiClientV4,
    logger: Logger,
    config: { defaultFoodGroup: string },
  ): Promise<boolean> {
    // Check if global food exists, handling 404 errors
    let existingGlobalFood: Awaited<ReturnType<typeof apiClient.foods.findGlobalFood>> | null = null;

    try {
      existingGlobalFood = await apiClient.foods.findGlobalFood(food.intake24Code);
    }
    catch (error: any) {
      // 404 means the food doesn't exist, which is expected for new foods
      if (error?.status === 404) {
        existingGlobalFood = null;
      }
      else {
        // Re-throw other errors
        logger.error(
          `Failed to look up global food ${food.intake24Code}: ${error instanceof Error ? error.message : String(error)}`,
          { detail: (error as any)?.detail ?? error },
        );
        throw error;
      }
    }

    if (!existingGlobalFood) {
      const globalFoodRequest: CreateGlobalFoodRequest = {
        code: food.intake24Code,
        name: food.englishDescription,
        foodGroupId: config.defaultFoodGroup,
        attributes: {
          readyMealOption: FoodDataParser.parseBoolean(food.readyMealOption),
          sameAsBeforeOption: FoodDataParser.parseBoolean(food.sameAsBeforeOption),
          reasonableAmount: FoodDataParser.parseNumber(food.reasonableAmount),
          useInRecipes: FoodDataParser.parseUseInRecipes(food.useInRecipes),
        },
        parentCategories: FoodDataParser.parseCategories(food.categories),
      };

      const globalResult = await apiClient.foods.createGlobalFood(globalFoodRequest);
      if (globalResult.type === 'conflict') {
        throw new Error(`Failed to create global food: Conflict with existing food (${food.intake24Code})`);
      }
      logger.debug(`Created global food: ${food.intake24Code}`);
      return true; // Created new global food
    }

    // Global food exists - check if we need to update categories or attributes
    const categories = food.categories?.trim()
      ? FoodDataParser.parseCategories(food.categories)
      : [];
    const existingCategories = existingGlobalFood.parentCategories?.map((c: any) => c.code) || [];

    // Check if categories have changed
    const categoriesChanged = categories.length > 0
      && (categories.length !== existingCategories.length
        || !categories.every(cat => existingCategories.includes(cat)));

    // Check if name has changed (normalize whitespace for comparison)
    const csvName = food.englishDescription?.trim() || '';
    const dbName = existingGlobalFood.name?.trim() || '';
    const nameChanged = csvName.length > 0 && csvName !== dbName;

    // Parse CSV attributes - use CSV values first, fallback to existing DB values
    const csvReadyMeal = FoodDataParser.parseBoolean(food.readyMealOption);
    const csvSameAsBefore = FoodDataParser.parseBoolean(food.sameAsBeforeOption);
    const csvReasonableAmount = FoodDataParser.parseNumber(food.reasonableAmount);
    const csvUseInRecipes = FoodDataParser.parseUseInRecipes(food.useInRecipes);

    const attributes: InheritableAttributes = {
      readyMealOption: csvReadyMeal ?? existingGlobalFood.attributes?.readyMealOption ?? undefined,
      sameAsBeforeOption: csvSameAsBefore ?? existingGlobalFood.attributes?.sameAsBeforeOption ?? undefined,
      reasonableAmount: csvReasonableAmount ?? existingGlobalFood.attributes?.reasonableAmount ?? undefined,
      useInRecipes: csvUseInRecipes ?? existingGlobalFood.attributes?.useInRecipes ?? undefined,
    };

    // Check if attributes have changed (comparing CSV values to existing DB values)
    const existingAttrs = existingGlobalFood.attributes;
    const attributesChanged
      = (csvReadyMeal !== undefined && csvReadyMeal !== existingAttrs?.readyMealOption)
        || (csvSameAsBefore !== undefined && csvSameAsBefore !== existingAttrs?.sameAsBeforeOption)
        || (csvReasonableAmount !== undefined && csvReasonableAmount !== existingAttrs?.reasonableAmount)
        || (csvUseInRecipes !== undefined && csvUseInRecipes !== existingAttrs?.useInRecipes);

    // Update if name, categories, or attributes have changed
    if (nameChanged || categoriesChanged || attributesChanged) {
      const updateRequest: UpdateGlobalFoodRequest = {
        name: csvName || existingGlobalFood.name,
        foodGroupId: existingGlobalFood.foodGroupId,
        attributes,
        parentCategories: categories.length > 0 ? categories : existingCategories,
      };

      await apiClient.foods.updateGlobalFood(
        food.intake24Code,
        existingGlobalFood.version,
        updateRequest,
      );

      const changes: string[] = [];
      if (nameChanged)
        changes.push('name');
      if (categoriesChanged)
        changes.push('categories');
      if (attributesChanged)
        changes.push('attributes');
      logger.debug(`Updated ${changes.join(', ')} for existing global food: ${food.intake24Code}`);
    }

    return false; // Global food already existed
  }

  private static async processLocalFood(
    food: FoodRow,
    localeId: string,
    apiClient: ApiClientV4,
    logger: Logger,
    config: {
      tags: string[];
      nutrientTableMapping: Record<string, string>;
      skipExisting: boolean;
      skipInvalidNutrients: boolean;
      skipAssociatedFoods: boolean;
    },
  ): Promise<ProcessLocalFoodResult> {
    const nutrientTableCodes = config.skipInvalidNutrients
      ? {}
      : FoodDataParser.parseNutrientTableCodes(
          food.foodCompositionTable,
          food.foodCompositionRecordId,
          config.nutrientTableMapping,
        );

    // Parse associated foods and capture any issues
    let associatedFoodsResult: ParseAssociatedFoodsResult = { associatedFoods: [], issues: [] };
    if (!config.skipAssociatedFoods) {
      associatedFoodsResult = await FoodDataParser.parseAssociatedFoods(food.associatedFood, apiClient);
    }

    const localFoodRequest: CreateLocalFoodRequest = {
      code: food.intake24Code,
      name: food.localDescription || food.englishDescription,
      altNames: FoodDataParser.parseAlternativeNames(
        FoodDataParser.getLanguageCode(localeId),
        food.synonyms,
        food.brandNames,
        food.brandNamesAsSearchTerms,
      ),
      tags: [...config.tags, ...FoodDataParser.parseTags(food)],
      nutrientTableCodes,
      portionSizeMethods: FoodDataParser.parsePortionSizeMethods(food.portionSizeEstimationMethods),
      associatedFoods: associatedFoodsResult.associatedFoods,
      attributes: {
        readyMealOption: FoodDataParser.parseBoolean(food.readyMealOption),
        sameAsBeforeOption: FoodDataParser.parseBoolean(food.sameAsBeforeOption),
        reasonableAmount: FoodDataParser.parseNumber(food.reasonableAmount),
        useInRecipes: FoodDataParser.parseUseInRecipes(food.useInRecipes),
      },
    };

    try {
      const localResult = await apiClient.foods.createLocalFood(localeId, localFoodRequest, {
        update: !config.skipExisting,
        return: false,
      });

      if (localResult.type === 'conflict') {
        if (config.skipExisting) {
          logger.info(`Skipping existing food: ${food.intake24Code}`);
          return { operation: 'skipped', associatedFoodIssues: associatedFoodsResult.issues };
        }
        throw new Error('Failed to create local food: Conflict with existing food');
      }

      const operation: FoodOperation = config.skipExisting ? 'created' : 'updated';
      logger.debug(`${operation} local food: ${food.intake24Code} for locale ${localeId}`);
      return { operation, associatedFoodIssues: associatedFoodsResult.issues };
    }
    catch (error) {
      const enrichedError = FoodProcessor.enrichLocalFoodError(error, nutrientTableCodes, food.intake24Code);
      logger.error(
        `Failed to process local food ${food.intake24Code}: ${enrichedError.message}`,
        { detail: (enrichedError as any).detail ?? (error as any)?.detail ?? error },
      );
      throw enrichedError;
    }
  }

  private static enrichLocalFoodError(
    error: unknown,
    nutrientTableCodes: Record<string, string>,
    foodCode: string,
  ): Error {
    const originalMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    const detail = (error as any)?.detail;

    const mappings = Object.entries(nutrientTableCodes)
      .map(([tableId, recordId]) => `${tableId}/${recordId}`)
      .join(', ');

    let detailText: string | undefined;
    if (typeof detail === 'string')
      detailText = detail;
    else if (detail !== undefined)
      detailText = JSON.stringify(detail);

    let message = originalMessage && originalMessage.trim().length > 0
      ? originalMessage
      : 'Food import failed (no error message provided)';

    if (detailText && !message.includes(detailText))
      message = `${message} - ${detailText}`;

    if (mappings && /Internal Server Error|500/i.test(message))
      message = `${message}. Check nutrient table record(s): ${mappings}`;

    if (!message.includes(foodCode))
      message = `[${foodCode}] ${message}`;

    const enrichedError = new Error(message);
    (enrichedError as any).detail = detail ?? (error as any)?.detail ?? detailText;
    return enrichedError;
  }
}

/**
 * Report generation utilities
 */
class ReportGenerator {
  static async generate(report: FoodImportReport, format: 'csv' | 'json' | 'markdown', outputPath: string): Promise<void> {
    switch (format) {
      case 'csv':
        await ReportGenerator.generateCSVReport(report, outputPath);
        break;
      case 'json':
        await ReportGenerator.generateJSONReport(report, outputPath);
        break;
      case 'markdown':
        await ReportGenerator.generateMarkdownReport(report, outputPath);
        break;
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  // Keep existing report generation methods...
  private static async generateCSVReport(report: FoodImportReport, outputPath: string): Promise<void> {
    const { writeFileSync } = await import('node:fs');
    const headers = ['Timestamp', 'Food Code', 'English Description', 'Local Description', 'Operation', 'Status', 'Error'];
    const rows = [headers];

    for (const detail of report.details) {
      rows.push([
        detail.timestamp.toISOString(),
        detail.foodCode,
        detail.englishDescription,
        detail.localDescription,
        detail.operation,
        detail.success ? 'Success' : 'Failed',
        detail.error || '',
      ]);
    }

    // Add summary
    rows.push(
      [],
      ['Summary'],
      ['Total Processed', report.summary.totalProcessed.toString()],
      ['Created', report.summary.created.toString()],
      ['Updated', report.summary.updated.toString()],
      ['Skipped', report.summary.skipped.toString()],
      ['Failed', report.summary.failed.toString()],
      ['Success Rate', `${report.summary.successRate.toFixed(2)}%`],
    );

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    writeFileSync(outputPath, csvContent, 'utf-8');
  }

  private static async generateJSONReport(report: FoodImportReport, outputPath: string): Promise<void> {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  private static async generateMarkdownReport(report: FoodImportReport, outputPath: string): Promise<void> {
    const { writeFileSync } = await import('node:fs');
    const { metadata, summary, details } = report;

    let content = `# Food Import Report

## Metadata
- **Start Time**: ${metadata.startTime.toISOString()}
- **End Time**: ${metadata.endTime?.toISOString() || 'N/A'}
- **Duration**: ${metadata.duration ? `${(metadata.duration / 1000).toFixed(2)} seconds` : 'N/A'}
- **Locale**: ${metadata.localeId}
- **Input File**: ${metadata.inputFile}
- **Skip Existing**: ${metadata.skipExisting}
- **Dry Run**: ${metadata.dryRun}

## Summary
| Metric | Count |
|--------|-------|
| Total Processed | ${summary.totalProcessed} |
| Created | ${summary.created} |
| Updated | ${summary.updated} |
| Skipped | ${summary.skipped} |
| Failed | ${summary.failed} |
| Success Rate | ${summary.successRate.toFixed(2)}% |
| Associated Food Lookup Failures | ${summary.associatedFoodLookupFailures || 0} |
| Skipped Associated Foods | ${summary.skippedAssociatedFoods || 0} |

## Details

### Successful Operations
`;

    const successful = details.filter(d => d.success);
    if (successful.length > 0) {
      content += `
| Food Code | English Description | Operation |
|-----------|-------------------|-----------|
`;
      for (const detail of successful) {
        content += `| ${detail.foodCode} | ${detail.englishDescription} | ${detail.operation} |\n`;
      }
    }
    else {
      content += '\nNo successful operations.\n';
    }

    const failed = details.filter(d => !d.success);
    if (failed.length > 0) {
      content += `
### Failed Operations

| Food Code | English Description | Error |
|-----------|-------------------|-------|
`;
      for (const detail of failed) {
        content += `| ${detail.foodCode} | ${detail.englishDescription} | ${detail.error || 'Unknown error'} |\n`;
      }
    }

    // Associated food issues section
    const associatedFoodIssues = report.associatedFoodIssues || [];
    if (associatedFoodIssues.length > 0) {
      const lookupFailures = associatedFoodIssues.filter(i => i.isLookupFailure);
      const skippedCodes = associatedFoodIssues.filter(i => !i.isLookupFailure);

      content += `
## Associated Food Issues

`;
      if (lookupFailures.length > 0) {
        content += `### Lookup Failures (API Errors)

These associated foods were skipped because the API lookup failed after retries. They may need to be manually verified.

| Food Code | Associated Code | Reason |
|-----------|----------------|--------|
`;
        for (const issue of lookupFailures) {
          content += `| ${issue.foodCode} | ${issue.associatedCode} | ${issue.reason} |\n`;
        }
        content += '\n';
      }

      if (skippedCodes.length > 0) {
        content += `### Skipped Associated Foods (Not Found)

These associated foods were skipped because the referenced code does not exist in the database.

| Food Code | Associated Code | Reason |
|-----------|----------------|--------|
`;
        for (const issue of skippedCodes) {
          content += `| ${issue.foodCode} | ${issue.associatedCode} | ${issue.reason} |\n`;
        }
      }
    }

    writeFileSync(outputPath, content, 'utf-8');
  }
}

/**
 * Food data parsing utilities
 */
class FoodDataParser {
  /**
   * Maps a locale ID to its language code for use in altNames.
   * E.g., jp_JP_2024 -> ja, en_GB -> en
   */
  static getLanguageCode(localeId: string): string {
    const localeToLanguage: Record<string, string> = {
      jp_JP_2024: 'ja',
      en_GB: 'en',
      en_AU: 'en',
      en_NZ: 'en',
      fr_FR: 'fr',
      pt_BR: 'pt',
      // Add more as needed
    };

    return localeToLanguage[localeId] || localeId.split('_')[0].toLowerCase();
  }

  static parseBoolean(value: string): boolean {
    if (!value)
      return false;
    return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
  }

  static parseNumber(value: string): number | undefined {
    if (!value)
      return undefined;
    const num = Number.parseFloat(value);
    return Number.isNaN(num) ? undefined : num;
  }

  static parseUseInRecipes(value: string): UseInRecipeType | undefined {
    if (!value)
      return undefined;

    const normalizedValue = value.toLowerCase().trim();

    // Map CSV values to UseInRecipeType
    // "Anywhere" or "0" → USE_ANYWHERE (0) - food can appear in both regular and recipe searches
    // "RegularFoodsOnly" or "1" → USE_AS_REGULAR_FOOD (1) - food only appears in regular search
    // "RecipesOnly" or "2" → USE_AS_RECIPE_INGREDIENT (2) - food only appears in recipe search
    if (normalizedValue === 'anywhere' || normalizedValue === '0') {
      return useInRecipeTypes.USE_ANYWHERE;
    }
    if (normalizedValue === 'regularfoodsonly' || normalizedValue === 'regular' || normalizedValue === '1') {
      return useInRecipeTypes.USE_AS_REGULAR_FOOD;
    }
    if (normalizedValue === 'recipesonly' || normalizedValue === 'recipes' || normalizedValue === '2') {
      return useInRecipeTypes.USE_AS_RECIPE_INGREDIENT;
    }

    // Unknown value - return undefined to let it inherit from category/defaults
    return undefined;
  }

  static parseCategories(value: string): string[] {
    if (!value)
      return [];
    return value.split(',').map(cat => cat.trim()).filter(Boolean);
  }

  /**
   * Parses synonyms and brand names from CSV into altNames structure.
   *
   * IMPORTANT: Synonyms are stored under the language code key (e.g., "ja" for Japanese),
   * NOT under a "synonyms" key. This enables proper language-based search indexing.
   *
   * Brand names are included as search terms under the language key to enable finding
   * foods by brand. Note: The Intake24 API does not currently support creating brand
   * records via the food import API - brands must be managed separately if needed.
   *
   * @param languageCode - The language code for the locale (e.g., "ja", "en")
   * @param synonyms - Comma-separated list of synonym terms
   * @param brandNames - Comma-separated list of brand names
   * @param brandNamesAsSearchTerms - Additional brand names to use as search terms
   */
  static parseAlternativeNames(
    languageCode: string,
    synonyms: string,
    brandNames: string,
    brandNamesAsSearchTerms: string,
  ): Record<string, string[]> {
    const altNames: Record<string, string[]> = {};

    const parseList = (value: string): string[] =>
      value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

    // Collect all search terms: synonyms + brand names
    const allTerms = new Set<string>();

    // Add synonyms
    if (synonyms) {
      for (const term of parseList(synonyms)) {
        allTerms.add(term);
      }
    }

    // Add brand names as search terms (users often search by brand)
    for (const source of [brandNames, brandNamesAsSearchTerms]) {
      if (!source)
        continue;
      for (const term of parseList(source)) {
        allTerms.add(term);
      }
    }

    // Store all terms under the language code key
    if (allTerms.size > 0) {
      altNames[languageCode] = [...allTerms];
    }

    return altNames;
  }

  static parseTags(food: FoodRow): string[] {
    const tags: string[] = [];

    if (food.foodCompositionTable) {
      tags.push(`composition-${food.foodCompositionTable.toLowerCase()}`);
    }

    return tags;
  }

  static tokenizeAssociatedFoods(value: string): Array<{ code: string; prompts: Record<string, string>; rawPrompt?: string }> {
    const entries: Array<{ code: string; prompts: Record<string, string>; rawPrompt?: string }> = [];

    const normalized = value.replace(/\r\n/g, '\n');
    const parts: string[] = [];
    let current = '';
    let parenDepth = 0;
    let braceDepth = 0;

    for (const char of normalized) {
      if (char === '(')
        parenDepth++;
      else if (char === ')' && parenDepth > 0)
        parenDepth--;
      else if (char === '{')
        braceDepth++;
      else if (char === '}' && braceDepth > 0)
        braceDepth--;

      if (char === ',' && parenDepth === 0 && braceDepth === 0) {
        if (current.trim().length > 0)
          parts.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim().length > 0)
      parts.push(current.trim());

    for (const part of parts) {
      const match = part.match(/^(\w+)(?:\((.*)\))?$/);

      if (!match) {
        console.warn(`Skipping unrecognised associated food fragment: "${part}"`);
        continue;
      }

      const code = match[1];
      const payload = match[2]?.trim() ?? '';

      const prompts = payload ? this.parsePromptTranslations(payload) : {};
      const rawPrompt = Object.keys(prompts).length > 0
        ? Object.values(prompts)[0]
        : this.extractRawPrompt(payload);

      entries.push({
        code,
        prompts,
        rawPrompt: rawPrompt || undefined,
      });
    }

    return entries;
  }

  private static parsePromptTranslations(payload: string): Record<string, string> {
    let content = payload.trim();
    const translations: Record<string, string> = {};

    if (!content)
      return translations;

    if (content.startsWith('{') && content.endsWith('}'))
      content = content.slice(1, -1);

    if (!content)
      return translations;

    // eslint-disable-next-line regexp/no-super-linear-backtracking -- complex regex for parsing key-value pairs
    const regex = /([\w-]+)\s*:\s*([^,]+(?:(?=,\s*[\w-]+\s*:)|$))/g;
    let match: RegExpExecArray | null;

    // eslint-disable-next-line no-cond-assign -- standard regex exec pattern
    while ((match = regex.exec(content)) !== null) {
      const key = match[1].trim();
      let value = match[2].trim();

      if (!key)
        continue;

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\'')))
        value = value.slice(1, -1);

      value = value.trim();
      if (!value)
        continue;

      translations[key] = value;
    }

    return translations;
  }

  private static extractRawPrompt(payload: string): string {
    if (!payload)
      return '';

    let text = payload.trim();

    if (text.startsWith('{') && text.endsWith('}'))
      text = text.slice(1, -1);

    text = text.replace(/^["']|["']$/g, '').trim();
    return text;
  }

  static parseNutrientTableCodes(
    table: string,
    recordId: string,
    tableMapping: Record<string, string>,
  ): Record<string, string> {
    if (!table || !recordId) {
      return {};
    }

    // Skip empty or placeholder values
    if (table.trim() === '' || recordId.trim() === '' || recordId === 'N/A' || recordId === '-') {
      return {};
    }

    const defaultMapping: Record<string, string> = {
      AUSNUT: 'AUSNUT',
      STFCJ: 'STFCJ',
      'DCD for Japan': 'DCDJapan',
      NDNS: 'NDNS',
      USDA: 'USDA',
      FCT: 'FCT',
      ...tableMapping,
    };

    const tableCode = defaultMapping[table] || table;

    // Only return valid nutrient mappings
    // Skip if record ID looks invalid (contains special characters that shouldn't be in nutrient codes)
    if (recordId.includes('/') || recordId.includes('\\') || recordId.length > 50) {
      console.warn(`Skipping invalid nutrient record ID: ${tableCode}/${recordId}`);
      return {};
    }

    return { [tableCode]: recordId };
  }

  static parsePortionSizeMethods(value: string): PortionSizeMethod[] {
    if (!value)
      return [];

    const methods: PortionSizeMethod[] = [];
    const methodStrings = value.split(/Method:/i).filter(Boolean);

    console.debug(`Parsing ${methodStrings.length} portion size methods from: "${value.substring(0, 100)}..."`);

    for (const methodStr of methodStrings) {
      const method = FoodDataParser.parsePortionSizeMethod(methodStr.trim());
      if (method) {
        methods.push(method);
        console.debug(`Successfully parsed ${method.method} method`);
      }
      else {
        console.warn(`Failed to parse portion method from: "${methodStr.trim()}"`);
      }
    }

    console.debug(`Total portion methods parsed: ${methods.length}`);
    return methods;
  }

  static parsePortionSizeMethod(methodStr: string): PortionSizeMethod | null {
    try {
      const normalizedInput = methodStr.replace(/\s+/g, ' ').trim();
      if (!normalizedInput.length)
        return null;

      const commaParts = normalizedInput.split(',').map(p => p.trim()).filter(Boolean);

      let methodName: string;
      let paramSection: string;

      if (commaParts.length > 1) {
        methodName = commaParts[0];
        paramSection = commaParts.slice(1).join(', ');
      }
      else {
        const firstSpace = normalizedInput.indexOf(' ');
        if (firstSpace === -1) {
          methodName = normalizedInput;
          paramSection = '';
        }
        else {
          methodName = normalizedInput.slice(0, firstSpace).trim();
          paramSection = normalizedInput.slice(firstSpace + 1).trim();
        }
      }

      methodName = methodName.toLowerCase();

      const params: Record<string, string> = {};
      const pushParam = (key: string, value: string) => {
        const trimmedValue = value.trim().replace(/,+$/, '');
        if (!trimmedValue)
          return;
        const normalizedKey = key.replace(/[-\s_]/g, '').toLowerCase();
        params[normalizedKey] = trimmedValue;
        params[key] = trimmedValue;
      };

      if (paramSection.length) {
        // eslint-disable-next-line regexp/no-super-linear-backtracking -- complex regex for parsing method parameters
        const regex = /([\w-]+)\s*:\s*([^:]+?)(?=\s+[\w-]+\s*:|$)/g;
        let match: RegExpExecArray | null;
        // eslint-disable-next-line no-cond-assign -- standard regex exec pattern
        while ((match = regex.exec(paramSection)) !== null) {
          pushParam(match[1], match[2]);
        }

        if (Object.keys(params).length === 0) {
          paramSection.split(',').forEach((part) => {
            const [key, value] = part.split(':').map(p => p.trim());
            if (key && value)
              pushParam(key, value);
          });
        }
      }

      const conversionFactor = Number.parseFloat(params.conversion || '1.0');

      if (methodName === 'as-served') {
        return {
          method: 'as-served',
          description: 'use_an_image',
          useForRecipes: false,
          conversionFactor,
          orderBy: '1',
          parameters: {
            servingImageSet: params.servingImageSet || params.servingimageset || 'default',
            leftoversImageSet: params.leftoversImageSet || params.leftoversimageset || null,
          },
        };
      }
      else if (methodName === 'standard-portion') {
        const units: StandardUnit[] = [];

        const getParamValue = (key: string): string | undefined => {
          const normalizedKey = key.replace(/[-\s_]/g, '').toLowerCase();
          return params[key]
            ?? params[normalizedKey]
            ?? params[key.toLowerCase()];
        };

        if (params.unitscount) {
          const unitCount = Number.parseInt(params.unitscount, 10);
          for (let i = 0; i < unitCount; i++) {
            const unitName = getParamValue(`unit${i}-name`);
            const unitWeight = getParamValue(`unit${i}-weight`);
            const unitOmit = getParamValue(`unit${i}-omit-food-description`);

            if (unitName && unitWeight) {
              units.push({
                name: unitName,
                weight: Number.parseFloat(unitWeight),
                omitFoodDescription: unitOmit === 'true',
              });
            }
          }
        }

        return {
          method: 'standard-portion',
          description: 'use_a_standard_portion',
          useForRecipes: false,
          conversionFactor,
          orderBy: '2',
          parameters: { units },
        };
      }
      else if (methodName === 'cereal') {
        return {
          method: 'cereal',
          description: 'cereal',
          useForRecipes: false,
          conversionFactor,
          orderBy: '3',
          parameters: {
            type: (params.type as any) || 'flake',
          },
        };
      }
      else if (methodName === 'drink-scale') {
        return {
          method: 'drink-scale',
          description: 'use_a_drink_scale',
          useForRecipes: false,
          conversionFactor,
          orderBy: '4',
          parameters: {
            drinkwareId: params.drinkwareid || params['drinkware-id'] || params.drinkwareId,
            initialFillLevel: Number.parseFloat(params.initialfilllevel || params['initial-fill-level'] || '0.9'),
            skipFillLevel: params.skipfilllevel === 'true' || params['skip-fill-level'] === 'true',
          },
        };
      }
      else if (methodName === 'guide-image') {
        return {
          method: 'guide-image',
          description: 'use_a_guide_image',
          useForRecipes: false,
          conversionFactor,
          orderBy: '5',
          parameters: {
            guideImageId: params.guideimageid || params['guide-image-id'] || params.guideImageId,
          },
        };
      }
      else if (methodName === 'direct-weight') {
        return {
          method: 'direct-weight',
          description: 'enter_weight_directly',
          useForRecipes: false,
          conversionFactor,
          orderBy: '6',
          parameters: {},
        };
      }
      else if (methodName === 'milk-in-a-hot-drink') {
        // Parse options if provided, otherwise use default structure
        const options: any = { en: [] };
        if (params.options) {
          try {
            // Options might be in format: option1:value1;option2:value2
            const optionPairs = params.options.split(';');
            optionPairs.forEach((pair: string) => {
              const [label, value] = pair.split(':');
              if (label && value) {
                options.en.push({ label, value: Number.parseFloat(value) });
              }
            });
          }
          catch (e) {
            console.warn('Failed to parse milk-in-a-hot-drink options:', e);
          }
        }

        return {
          method: 'milk-in-a-hot-drink',
          description: 'milk_in_a_hot_drink',
          useForRecipes: false,
          conversionFactor,
          orderBy: '7',
          parameters: {
            options,
          },
        };
      }
      else if (methodName === 'milk-on-cereal') {
        return {
          method: 'milk-on-cereal',
          description: 'milk_on_cereal',
          useForRecipes: false,
          conversionFactor,
          orderBy: '8',
          parameters: {},
        };
      }
      else if (methodName === 'parent-food-portion') {
        // Parse options similar to milk-in-a-hot-drink
        const options: any = { _default: { en: [] } };
        if (params.options) {
          try {
            const optionPairs = params.options.split(';');
            optionPairs.forEach((pair: string) => {
              const [label, value] = pair.split(':');
              if (label && value) {
                options._default.en.push({ label, value: Number.parseFloat(value) });
              }
            });
          }
          catch (e) {
            console.warn('Failed to parse parent-food-portion options:', e);
          }
        }

        return {
          method: 'parent-food-portion',
          description: 'parent_food_portion',
          useForRecipes: false,
          conversionFactor,
          orderBy: '9',
          parameters: {
            options,
          },
        };
      }
      else if (methodName === 'pizza') {
        return {
          method: 'pizza',
          description: 'pizza',
          useForRecipes: false,
          conversionFactor,
          orderBy: '10',
          parameters: {},
        };
      }
      else if (methodName === 'pizza-v2') {
        return {
          method: 'pizza-v2',
          description: 'pizza_v2',
          useForRecipes: false,
          conversionFactor,
          orderBy: '11',
          parameters: {},
        };
      }
      else if (methodName === 'recipe-builder') {
        return {
          method: 'recipe-builder',
          description: 'recipe_builder',
          useForRecipes: false,
          conversionFactor,
          orderBy: '12',
          parameters: {},
        };
      }
      else if (methodName === 'unknown') {
        return {
          method: 'unknown',
          description: 'unknown_portion_size',
          useForRecipes: false,
          conversionFactor,
          orderBy: '13',
          parameters: {},
        };
      }

      // Log unrecognized method for debugging
      console.warn(`Unrecognized portion size method: ${methodName}`);
      return null;
    }
    catch (error) {
      console.error('Error parsing portion size method:', error);
      return null;
    }
  }

  static async parseAssociatedFoods(value: string, apiClient: ApiClientV4): Promise<ParseAssociatedFoodsResult> {
    const result: ParseAssociatedFoodsResult = {
      associatedFoods: [],
      issues: [],
    };

    if (!value || value.trim() === '') {
      return result;
    }

    const lookupService = FoodCategoryLookupApiService.getInstance(apiClient);

    try {
      const entries = FoodDataParser.tokenizeAssociatedFoods(value);

      if (entries.length === 0) {
        console.warn(`No associated foods found in expected format for: "${value}"`);
        return result;
      }

      const codes = entries.map(entry => entry.code);
      const lookupResults = await lookupService.lookupCodes(codes);

      for (const entry of entries) {
        const lookupResult = lookupResults.get(entry.code);

        // Check for lookup failures (API errors after retries)
        if (lookupResult?.lookupFailed) {
          const reason = 'API lookup failed after retries';
          console.error(`Associated code "${entry.code}" lookup FAILED (${reason}), tracking in report.`);
          result.issues.push({
            associatedCode: entry.code,
            reason,
            isLookupFailure: true,
          });
          continue;
        }

        // Check for codes that don't exist
        if (!lookupResult || !lookupResult.exists) {
          const reason = `Code not found in database (type: ${lookupResult?.type || 'unknown'})`;
          console.warn(`Associated code "${entry.code}" ${reason}, skipping.`);
          result.issues.push({
            associatedCode: entry.code,
            reason,
            isLookupFailure: false,
          });
          continue;
        }

        const isCategory = lookupResult.type === 'category';

        // Determine prompt translations
        const translations = Object.keys(entry.prompts).length > 0
          ? { ...entry.prompts }
          : {};

        if (!translations.en) {
          const fallback = translations.id
            || translations.jp
            || entry.rawPrompt
            || lookupResult.name
            || entry.code;
          if (fallback)
            translations.en = fallback;
        }

        const promptText = Object.keys(translations).length > 0
          ? translations
          : { en: lookupResult.name || entry.code };

        const associatedFood = {
          ...(isCategory
            ? { foodCode: undefined, categoryCode: entry.code }
            : { foodCode: entry.code, categoryCode: undefined }
          ),
          promptText,
          linkAsMain: false,
          allowMultiple: false,
          genericName: { ...promptText },
        };

        console.debug(`Associated code "${entry.code}" classified as ${lookupResult.type.toUpperCase()} (${lookupResult.name || 'no name'})`);

        result.associatedFoods.push(associatedFood);
      }

      if (result.associatedFoods.length > 0)
        console.debug(`Parsed ${result.associatedFoods.length} associated food(s) from: "${value}"`);
      if (result.issues.length > 0)
        console.warn(`${result.issues.length} associated food issue(s) for: "${value}"`);
    }
    catch (error) {
      console.warn(`Failed to parse associated foods from "${value}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }

    return result;
  }
}

/**
 * Main entry point - maintains backward compatibility
 */
export default async function importFoodsCommand(options: FoodImportOptions): Promise<void> {
  const orchestrator = new FoodImportOrchestrator(options);
  await orchestrator.execute();
}
