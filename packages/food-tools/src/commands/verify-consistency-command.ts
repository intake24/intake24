/**
 * Database-CSV Consistency Verification Command
 *
 * Compares CSV food data against database records to identify discrepancies
 * in categories, names, attributes, and other food properties.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { logger as mainLogger } from '@intake24/common-backend';
import type { Logger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';
import type { FoodEntry } from '@intake24/common/types/http/admin/foods';
import { Database, databaseConfig } from '@intake24/db';
import { parse as parseCsv } from 'csv-parse/sync';

type GlobalFood = FoodEntry;

// Type stubs for missing interfaces
interface LocalFood {
  name: string;
}

interface FoodResponse {
  data: {
    foods: GlobalFood[];
  };
}

interface FoodLocalResponse {
  data: LocalFood;
}

// Define interfaces for consistency checking
export interface ConsistencyCheckOptions {
  inputPath: string;
  localeId: string;
  reportPath?: string;
  reportFormat?: 'csv' | 'json' | 'markdown';
  skipHeaderRows?: number;
  includeValidRows?: boolean;
  checkCategories?: boolean;
  checkNames?: boolean;
  checkAttributes?: boolean;
  checkNutrients?: boolean;
  checkPortionSizes?: boolean;
  checkAssociatedFoods?: boolean;
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

interface DatabaseFood {
  code: string;
  name: string;
  categories: string[];
  attributes?: {
    readyMealOption?: boolean | null;
    sameAsBeforeOption?: boolean | null;
    reasonableAmount?: number | null;
    useInRecipes?: number | null;
  };
  localName?: string;
  enabled?: boolean;
}

interface CategoryDiscrepancy {
  foodCode: string;
  englishName: string;
  localName: string;
  action: string;
  csvCategories: string[];
  dbCategories: string[];
  missing: string[];
  extra: string[];
  severity: 'critical' | 'warning' | 'info';
}

interface NameDiscrepancy {
  foodCode: string;
  action: string;
  csvEnglish: string;
  dbEnglish: string;
  csvLocal: string;
  dbLocal: string;
  englishMatch: boolean;
  localMatch: boolean;
}

interface MissingFood {
  foodCode: string;
  action: string;
  englishName: string;
  localName: string;
  categories: string[];
  reason: 'not_in_global' | 'not_in_locale' | 'disabled';
}

interface NutrientDiscrepancy {
  foodCode: string;
  englishName: string;
  localName: string;
  csvTable: string;
  csvRecordId: string;
  dbTable: string | null;
  dbRecordId: string | null;
  issue: 'missing_mapping' | 'table_mismatch' | 'record_not_found' | 'multiple_mappings';
  severity: 'critical' | 'warning';
}

interface PortionSizeDiscrepancy {
  foodCode: string;
  englishName: string;
  localName: string;
  csvMethods: Array<{
    method: string;
    conversion: number;
    parameters: Record<string, any>;
  }>;
  dbMethods: Array<{
    method: string;
    conversion: number;
    description: string;
    order: number;
  }>;
  issue: 'missing_methods' | 'method_mismatch' | 'conversion_mismatch' | 'extra_methods';
  severity: 'critical' | 'warning' | 'info';
}

interface AssociatedFoodDiscrepancy {
  foodCode: string;
  englishName: string;
  localName: string;
  csvAssociatedFoods: Array<{
    code: string;
    text: string;
    type: 'food' | 'category';
  }>;
  dbAssociatedFoods: Array<{
    associatedFoodCode: string | null;
    associatedCategoryCode: string | null;
    text: any;
    linkAsMain: boolean;
    multiple: boolean;
    order: number;
  }>;
  issue: 'missing_associations' | 'association_mismatch' | 'extra_associations';
  severity: 'critical' | 'warning' | 'info';
}

interface AttributeDiscrepancy {
  foodCode: string;
  englishName: string;
  localName: string;
  attributes: {
    readyMealOption?: { csv: boolean; db: boolean | null | undefined; match: boolean };
    sameAsBeforeOption?: { csv: boolean; db: boolean | null | undefined; match: boolean };
    reasonableAmount?: { csv: number | null; db: number | null | undefined; match: boolean };
    useInRecipes?: { csv: number | null; db: number | null | undefined; match: boolean };
  };
  issueCount: number;
  severity: 'critical' | 'warning' | 'info';
}

interface ConsistencyReport {
  metadata: {
    generatedAt: string;
    inputFile: string;
    localeId: string;
    totalCsvRows: number;
    totalDbFoods: number;
    checksPerformed: string[];
  };
  summary: {
    totalChecked: number;
    perfectMatches: number;
    categoryDiscrepancies: number;
    nameDiscrepancies: number;
    missingFoods: number;
    nutrientDiscrepancies: number;
    portionSizeDiscrepancies: number;
    associatedFoodDiscrepancies: number;
    attributeDiscrepancies: number;
    consistencyScore: number; // 0-100%
    qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  discrepancies: {
    categories: CategoryDiscrepancy[];
    names: NameDiscrepancy[];
    missing: MissingFood[];
    nutrients: NutrientDiscrepancy[];
    portionSizes: PortionSizeDiscrepancy[];
    associatedFoods: AssociatedFoodDiscrepancy[];
    attributes: AttributeDiscrepancy[];
  };
  recommendations: string[];
}

/**
 * Database-CSV Consistency Checker
 */
class ConsistencyChecker {
  private logger: Logger;
  private apiClient: ApiClientV4;
  private database?: any;

  constructor() {
    this.logger = mainLogger.child({ service: 'Consistency Checker' });
    const apiOptions = getApiClientV4EnvOptions();
    this.apiClient = new ApiClientV4(this.logger, apiOptions);
  }

  /**
   * Initialize database connection
   */
  private async initDatabase(): Promise<void> {
    if (!this.database) {
      this.database = new (Database as any)({
        databaseConfig,
        logger: this.logger,
        environment: (process.env.NODE_ENV || 'development') as Environment,
      });
      await this.database.init();
      await this.database.init();
    }
  }

  /**
   * Close database connection
   */
  private async closeDatabase(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = undefined;
    }
  }

  /**
   * Main consistency verification method
   */
  async verifyConsistency(options: ConsistencyCheckOptions): Promise<ConsistencyReport> {
    this.logger.info(`🔍 Starting consistency verification for ${options.localeId}`);

    try {
      // Initialize database connection for direct queries
      await this.initDatabase();

      // Step 1: Parse CSV file
      const csvFoods = await this.parseCsvFile(options.inputPath, options.skipHeaderRows || 3);
      this.logger.info(`📋 Parsed ${csvFoods.length} foods from CSV`);

      // Step 2: Fetch database foods
      const dbFoods = await this.fetchDatabaseFoods(options.localeId, csvFoods.map(f => f.intake24Code));
      this.logger.info(`🗄️ Retrieved ${dbFoods.length} foods from database`);

      // Step 3: Perform comparisons
      const categoryDiscrepancies = options.checkCategories !== false
        ? await this.checkCategoryConsistency(csvFoods, dbFoods)
        : [];

      const nameDiscrepancies = options.checkNames !== false
        ? await this.checkNameConsistency(csvFoods, dbFoods)
        : [];

      const missingFoods = await this.checkMissingFoods(csvFoods, dbFoods, options.localeId);

      const nutrientDiscrepancies = options.checkNutrients !== false
        ? await this.checkNutrientConsistency(csvFoods, dbFoods, options.localeId)
        : [];

      const portionSizeDiscrepancies = options.checkPortionSizes !== false
        ? await this.checkPortionSizeConsistency(csvFoods, dbFoods, options.localeId)
        : [];

      const associatedFoodDiscrepancies = options.checkAssociatedFoods !== false
        ? await this.checkAssociatedFoodConsistency(csvFoods, dbFoods, options.localeId)
        : [];

      const attributeDiscrepancies = options.checkAttributes !== false
        ? await this.checkAttributeConsistency(csvFoods, dbFoods)
        : [];

      // Step 4: Generate report
      const report = this.generateReport(
        options,
        csvFoods,
        dbFoods,
        categoryDiscrepancies,
        nameDiscrepancies,
        missingFoods,
        nutrientDiscrepancies,
        portionSizeDiscrepancies,
        associatedFoodDiscrepancies,
        attributeDiscrepancies,
      );

      // Step 5: Save report if requested
      if (options.reportPath) {
        await this.saveReport(report, options.reportPath, options.reportFormat || 'json');
      }

      return report;
    }
    finally {
      // Clean up database connection
      await this.closeDatabase();
    }
  }

  /**
   * Parse CSV file into structured food data
   */
  private async parseCsvFile(inputPath: string, skipRows: number): Promise<FoodRow[]> {
    const csvContent = readFileSync(inputPath, 'utf8');
    const headerLineIndex = this.findHeaderLineIndex(csvContent);
    const fromLine = headerLineIndex >= 0 ? headerLineIndex + 1 : Math.max(skipRows + 1, 1);

    const records = parseCsv(csvContent, {
      columns: (header: string[]) => this.normalizeHeaders(header),
      from_line: fromLine,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
    }) as Record<string, unknown>[];

    return records
      .map(record => this.mapRecordToFoodRow(record))
      .filter(food => food.intake24Code.length > 0);
  }

  private findHeaderLineIndex(content: string): number {
    const lines = content.split(/\r?\n/);
    return lines.findIndex(line => /intake24\s*code/i.test(line));
  }

  private normalizeHeaders(headers: string[]): string[] {
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

  private normalizeHeaderName(header: string): string {
    return header
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  private mapRecordToFoodRow(record: Record<string, unknown>): FoodRow {
    return {
      intake24Code: this.getColumnValue(record, ['intake24_code', 'code']),
      action: this.getColumnValue(record, ['action']),
      englishDescription: this.getColumnValue(record, ['english_description', 'description']),
      localDescription: this.getColumnValue(record, ['local_description', 'local_name']),
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
      categories: this.getColumnValue(record, ['categories']),
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

  /**
   * Fetch database food data for comparison
   */
  private async fetchDatabaseFoods(localeId: string, foodCodes: string[]): Promise<DatabaseFood[]> {
    const dbFoods: DatabaseFood[] = [];

    // First, get the list of enabled foods in this locale
    let enabledFoodsSet: Set<string>;
    try {
      const enabledFoodsResponse = await this.apiClient.foods.getEnabledFoods(localeId);
      const enabledFoodsList = (enabledFoodsResponse as any)?.enabledFoods || (enabledFoodsResponse as any)?.data || [];
      enabledFoodsSet = new Set(enabledFoodsList);
    }
    catch (error) {
      this.logger.warn(`Failed to get enabled foods for locale ${localeId}: ${error instanceof Error ? error.message : String(error)}`);
      enabledFoodsSet = new Set();
    }

    // Batch process food codes to avoid overwhelming the API
    const batchSize = 50;
    for (let i = 0; i < foodCodes.length; i += batchSize) {
      const batch = foodCodes.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (code) => {
          try {
            // Get global food data
            const globalFood = await this.apiClient.foods.findGlobalFood(code);
            if (!globalFood) {
              return null;
            }

            // Check if food is enabled in locale
            const enabled = enabledFoodsSet.has(code);

            // Get categories
            const categories = globalFood.parentCategories?.map((cat: any) => cat.code) || [];

            // Get local food data to fetch locale-specific names
            let localName: string | undefined;

            return {
              code,
              name: globalFood.name,
              categories,
              attributes: {
                readyMealOption: (globalFood as any).attributes?.readyMealOption,
                sameAsBeforeOption: (globalFood as any).attributes?.sameAsBeforeOption,
                reasonableAmount: (globalFood as any).attributes?.reasonableAmount,
                useInRecipes: (globalFood as any).attributes?.useInRecipes,
              },
              localName,
              enabled,
            };
          }
          catch (error) {
            this.logger.debug(`Failed to fetch food ${code}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
          }
        }),
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          dbFoods.push(result.value);
        }
      });

      // Small delay to be nice to the API
      if (i + batchSize < foodCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // After fetching all global foods, get local names in batch
    if (this.database && dbFoods.length > 0) {
      await this.fetchLocalNamesInBatch(dbFoods, localeId);
    }

    return dbFoods;
  }

  /**
   * Fetch local names for foods using direct database query
   */
  private async fetchLocalNamesInBatch(foods: DatabaseFood[], localeId: string): Promise<void> {
    if (!this.database) {
      this.logger.warn('Database connection not available for fetching local names');
      return;
    }

    try {
      // Build query to get all local names at once
      const foodCodes = foods.map(f => f.code);
      const placeholders = foodCodes.map((_, index) => `$${index + 2}`).join(', ');

      const query = `
        SELECT fl.food_code, fl.name
        FROM food_locals fl
        WHERE fl.locale_id = $1
        AND fl.food_code IN (${placeholders})
      `;

      const params = [localeId, ...foodCodes];
      const result = await this.database.foods.query(query, { bind: params }) as any;

      // Create a map of food code to local name
      const localNameMap = new Map<string, string>();
      if (result && result[0]) {
        for (const row of result[0]) {
          localNameMap.set(row.food_code, row.name);
        }
      }

      // Update foods with local names
      for (const food of foods) {
        food.localName = localNameMap.get(food.code);
      }

      this.logger.info(`🌏 Fetched ${localNameMap.size} local names for ${localeId}`);
    }
    catch (error) {
      this.logger.warn(`Failed to fetch local names: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check category consistency between CSV and database
   */
  private async checkCategoryConsistency(csvFoods: FoodRow[], dbFoods: DatabaseFood[]): Promise<CategoryDiscrepancy[]> {
    const discrepancies: CategoryDiscrepancy[] = [];
    const dbFoodMap = new Map(dbFoods.map(f => [f.code, f]));

    for (const csvFood of csvFoods) {
      // Skip foods with action "1" as they are excluded from DB
      if (csvFood.action === '1') {
        continue;
      }
      
      const dbFood = dbFoodMap.get(csvFood.intake24Code);
      if (!dbFood)
        continue;

      const csvCategories = this.parseCategories(csvFood.categories);
      const dbCategories = dbFood.categories;

      // Skip if no categories to compare
      if (csvCategories.length === 0 && dbCategories.length === 0)
        continue;

      // When the CSV leaves categories blank for existing foods (actions 2 & 3),
      // it indicates "keep current assignments", so don't flag differences.
      if (csvCategories.length === 0 && (csvFood.action === '2' || csvFood.action === '3'))
        continue;

      // Find differences
      const missing = csvCategories.filter(cat => !dbCategories.includes(cat));
      const extra = dbCategories.filter(cat => !csvCategories.includes(cat));

      if (missing.length > 0 || extra.length > 0) {
        let severity: 'critical' | 'warning' | 'info' = 'info';

        // Determine severity
        if (missing.length > extra.length) {
          severity = 'critical'; // Missing categories are more serious
        }
        else if (missing.length > 0 || extra.length > 2) {
          severity = 'warning';
        }

        discrepancies.push({
          foodCode: csvFood.intake24Code,
          englishName: csvFood.englishDescription,
          localName: csvFood.localDescription || csvFood.englishDescription,
          action: csvFood.action,
          csvCategories,
          dbCategories,
          missing,
          extra,
          severity,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Check name consistency between CSV and database
   */
  private async checkNameConsistency(csvFoods: FoodRow[], dbFoods: DatabaseFood[]): Promise<NameDiscrepancy[]> {
    const discrepancies: NameDiscrepancy[] = [];
    const dbFoodMap = new Map(dbFoods.map(f => [f.code, f]));

    for (const csvFood of csvFoods) {
      // Skip foods with action "1" as they are excluded from DB
      if (csvFood.action === '1') {
        continue;
      }
      
      const dbFood = dbFoodMap.get(csvFood.intake24Code);
      if (!dbFood)
        continue;

      const englishMatch = csvFood.englishDescription.trim() === dbFood.name?.trim();
      const localMatch = !csvFood.localDescription
        || csvFood.localDescription.trim() === (dbFood.localName?.trim() || '');

      if (!englishMatch || !localMatch) {
        discrepancies.push({
          foodCode: csvFood.intake24Code,
          action: csvFood.action,
          csvEnglish: csvFood.englishDescription,
          dbEnglish: dbFood.name || '',
          csvLocal: csvFood.localDescription || '',
          dbLocal: dbFood.localName || '',
          englishMatch,
          localMatch,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Check for foods that exist in CSV but not in database
   */
  private async checkMissingFoods(csvFoods: FoodRow[], dbFoods: DatabaseFood[], localeId: string): Promise<MissingFood[]> {
    const missing: MissingFood[] = [];
    const dbFoodCodes = new Set(dbFoods.map(f => f.code));

    for (const csvFood of csvFoods) {
      // Skip foods with action "1" as they are intentionally excluded from DB
      if (csvFood.action === '1') {
        continue;
      }
      
      if (!dbFoodCodes.has(csvFood.intake24Code)) {
        let reason: 'not_in_global' | 'not_in_locale' | 'disabled' = 'not_in_global';

        // Try to determine why it's missing
        try {
          const globalFood = await this.apiClient.foods.findGlobalFood(csvFood.intake24Code);
          if (globalFood) {
            reason = 'not_in_locale'; // Global exists but not in locale
          }
        }
        catch {
          reason = 'not_in_global'; // Doesn't exist globally
        }

        missing.push({
          foodCode: csvFood.intake24Code,
          action: csvFood.action,
          englishName: csvFood.englishDescription,
          localName: csvFood.localDescription || csvFood.englishDescription,
          categories: this.parseCategories(csvFood.categories),
          reason,
        });
      }
      else {
        // Check if it's disabled in locale
        const dbFood = dbFoods.find(f => f.code === csvFood.intake24Code);
        if (dbFood && !dbFood.enabled) {
          missing.push({
            foodCode: csvFood.intake24Code,
            action: csvFood.action,
            englishName: csvFood.englishDescription,
            localName: csvFood.localDescription || csvFood.englishDescription,
            categories: this.parseCategories(csvFood.categories),
            reason: 'disabled',
          });
        }
      }
    }

    return missing;
  }

  /**
   * Check nutrient table record consistency
   */
  private async checkNutrientConsistency(csvFoods: FoodRow[], dbFoods: DatabaseFood[], localeId: string): Promise<NutrientDiscrepancy[]> {
    const discrepancies: NutrientDiscrepancy[] = [];
    
    if (!this.database) {
      this.logger.warn('Database connection not available for nutrient consistency check');
      return discrepancies;
    }

    const dbFoodMap = new Map(dbFoods.map(f => [f.code, f]));
    
    // Get all food codes that have nutrient table data in CSV (excluding action "1")
    const foodsWithNutrients = csvFoods.filter(f => 
      f.action !== '1' && f.foodCompositionTable && f.foodCompositionRecordId && dbFoodMap.has(f.intake24Code)
    );
    
    if (foodsWithNutrients.length === 0) {
      return discrepancies;
    }

    try {
      // Build query to get nutrient mappings for all foods at once
      const foodCodes = foodsWithNutrients.map(f => f.intake24Code);
      const placeholders = foodCodes.map((_, index) => `$${index + 2}`).join(', ');
      
      const query = `
        SELECT 
          fl.food_code,
          fl.id as food_local_id,
          fn.nutrient_table_record_id,
          ntr.nutrient_table_id,
          ntr.nutrient_table_record_id as record_id,
          nt.id as table_id,
          nt.description as table_description
        FROM food_locals fl
        LEFT JOIN foods_nutrients fn ON fl.id = fn.food_local_id
        LEFT JOIN nutrient_table_records ntr ON fn.nutrient_table_record_id = ntr.id
        LEFT JOIN nutrient_tables nt ON ntr.nutrient_table_id = nt.id
        WHERE fl.locale_id = $1 
        AND fl.food_code IN (${placeholders})
      `;
      
      const params = [localeId, ...foodCodes];
      const result = await this.database.foods.query(query, { bind: params }) as any;
      
      // Create a map of food code to nutrient mappings
      const nutrientMap = new Map<string, Array<{
        table_id: string | null;
        record_id: string | null;
        table_description: string | null;
      }>>();
      
      if (result && result[0]) {
        for (const row of result[0]) {
          const mappings = nutrientMap.get(row.food_code) || [];
          mappings.push({
            table_id: row.table_id,
            record_id: row.record_id,
            table_description: row.table_description,
          });
          nutrientMap.set(row.food_code, mappings);
        }
      }
      
      // Check each food for nutrient consistency
      for (const csvFood of foodsWithNutrients) {
        const dbFood = dbFoodMap.get(csvFood.intake24Code);
        if (!dbFood) continue;
        
        const mappings = nutrientMap.get(csvFood.intake24Code) || [];
        
        if (mappings.length === 0 || (mappings.length === 1 && !mappings[0].table_id)) {
          // No nutrient mapping found
          discrepancies.push({
            foodCode: csvFood.intake24Code,
            englishName: csvFood.englishDescription,
            localName: csvFood.localDescription || csvFood.englishDescription,
            csvTable: csvFood.foodCompositionTable,
            csvRecordId: csvFood.foodCompositionRecordId,
            dbTable: null,
            dbRecordId: null,
            issue: 'missing_mapping',
            severity: 'critical',
          });
        } else if (mappings.length > 1 && mappings.filter(m => m.table_id).length > 1) {
          // Multiple mappings found (shouldn't happen normally)
          discrepancies.push({
            foodCode: csvFood.intake24Code,
            englishName: csvFood.englishDescription,
            localName: csvFood.localDescription || csvFood.englishDescription,
            csvTable: csvFood.foodCompositionTable,
            csvRecordId: csvFood.foodCompositionRecordId,
            dbTable: mappings[0].table_id,
            dbRecordId: mappings[0].record_id,
            issue: 'multiple_mappings',
            severity: 'warning',
          });
        } else {
          // Check if table and record match
          const mapping = mappings.find(m => m.table_id) || mappings[0];
          
          // Normalize table names for comparison
          const normalizedCsvTable = this.normalizeNutrientTableName(csvFood.foodCompositionTable);
          const normalizedDbTable = this.normalizeNutrientTableName(mapping.table_id || '');
          
          // Debug logging for DCD for Japan issue
          if (csvFood.foodCompositionTable === 'DCD for Japan' || mapping.table_id === 'DCDJapan') {
            this.logger.debug(`Nutrient table comparison for ${csvFood.intake24Code}:`);
            this.logger.debug(`  CSV table: "${csvFood.foodCompositionTable}" -> normalized: "${normalizedCsvTable}"`);
            this.logger.debug(`  DB table: "${mapping.table_id}" -> normalized: "${normalizedDbTable}"`);
          }
          
          if (normalizedCsvTable !== normalizedDbTable) {
            discrepancies.push({
              foodCode: csvFood.intake24Code,
              englishName: csvFood.englishDescription,
              localName: csvFood.localDescription || csvFood.englishDescription,
              csvTable: csvFood.foodCompositionTable,
              csvRecordId: csvFood.foodCompositionRecordId,
              dbTable: mapping.table_id,
              dbRecordId: mapping.record_id,
              issue: 'table_mismatch',
              severity: 'critical',
            });
          } else if (mapping.record_id !== csvFood.foodCompositionRecordId) {
            // Table matches but record ID is different
            // Need to check if the CSV record actually exists in the nutrient table
            const recordExists = await this.checkNutrientRecordExists(
              csvFood.foodCompositionTable,
              csvFood.foodCompositionRecordId
            );
            
            if (!recordExists) {
              discrepancies.push({
                foodCode: csvFood.intake24Code,
                englishName: csvFood.englishDescription,
                localName: csvFood.localDescription || csvFood.englishDescription,
                csvTable: csvFood.foodCompositionTable,
                csvRecordId: csvFood.foodCompositionRecordId,
                dbTable: mapping.table_id,
                dbRecordId: mapping.record_id,
                issue: 'record_not_found',
                severity: 'critical',
              });
            }
          }
        }
      }
      
      this.logger.info(`🔬 Checked nutrient consistency for ${foodsWithNutrients.length} foods`);
    } catch (error) {
      this.logger.error(`Failed to check nutrient consistency: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return discrepancies;
  }

  /**
   * Check if a nutrient record exists in the nutrient table
   */
  private async checkNutrientRecordExists(tableId: string, recordId: string): Promise<boolean> {
    if (!this.database) {
      return false;
    }
    
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM nutrient_table_records
        WHERE nutrient_table_id = $1
        AND nutrient_table_record_id = $2
      `;
      
      const result = await this.database.foods.query(query, { bind: [tableId, recordId] }) as any;
      return result?.[0]?.[0]?.count > 0;
    } catch (error) {
      this.logger.debug(`Failed to check nutrient record existence: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check portion size method consistency
   */
  private async checkPortionSizeConsistency(csvFoods: FoodRow[], dbFoods: DatabaseFood[], localeId: string): Promise<PortionSizeDiscrepancy[]> {
    const discrepancies: PortionSizeDiscrepancy[] = [];
    
    if (!this.database) {
      this.logger.warn('Database connection not available for portion size consistency check');
      return discrepancies;
    }

    const dbFoodMap = new Map(dbFoods.map(f => [f.code, f]));
    
    // Get all food codes that have portion size methods in CSV (excluding action "1")
    const foodsWithPortionSizes = csvFoods.filter(f => 
      f.action !== '1' && f.portionSizeEstimationMethods && f.portionSizeEstimationMethods.trim() && dbFoodMap.has(f.intake24Code)
    );
    
    if (foodsWithPortionSizes.length === 0) {
      return discrepancies;
    }

    try {
      // Build query to get portion size methods for all foods at once
      const foodCodes = foodsWithPortionSizes.map(f => f.intake24Code);
      const placeholders = foodCodes.map((_, index) => `$${index + 2}`).join(', ');
      
      const query = `
        SELECT 
          fl.food_code,
          fl.id as food_local_id,
          fpsm.id,
          fpsm.method,
          fpsm.description,
          fpsm.conversion_factor,
          fpsm.order_by,
          fpsm.parameters,
          fpsm.use_for_recipes
        FROM food_locals fl
        LEFT JOIN food_portion_size_methods fpsm ON fl.id = fpsm.food_local_id
        WHERE fl.locale_id = $1 
        AND fl.food_code IN (${placeholders})
        ORDER BY fl.food_code, fpsm.order_by
      `;
      
      const params = [localeId, ...foodCodes];
      const result = await this.database.foods.query(query, { bind: params }) as any;
      
      // Create a map of food code to portion size methods
      const portionSizeMap = new Map<string, Array<{
        method: string;
        conversion: number;
        description: string;
        order: number;
        parameters: any;
        useForRecipes: boolean;
      }>>();
      
      if (result && result[0]) {
        for (const row of result[0]) {
          const methods = portionSizeMap.get(row.food_code) || [];
          if (row.method) {
            methods.push({
              method: row.method,
              conversion: parseFloat(row.conversion_factor),
              description: row.description,
              order: parseInt(row.order_by),
              parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
              useForRecipes: row.use_for_recipes,
            });
          }
          portionSizeMap.set(row.food_code, methods);
        }
      }
      
      // Check each food for portion size consistency
      for (const csvFood of foodsWithPortionSizes) {
        const dbFood = dbFoodMap.get(csvFood.intake24Code);
        if (!dbFood) continue;
        
        // Parse CSV portion size methods
        const csvMethods = this.parsePortionSizeMethods(csvFood.portionSizeEstimationMethods);
        const dbMethods = portionSizeMap.get(csvFood.intake24Code) || [];
        
        // Compare methods
        if (csvMethods.length === 0 && dbMethods.length === 0) {
          continue; // Both empty, no discrepancy
        }
        
        if (dbMethods.length === 0 && csvMethods.length > 0) {
          // No methods in database
          discrepancies.push({
            foodCode: csvFood.intake24Code,
            englishName: csvFood.englishDescription,
            localName: csvFood.localDescription || csvFood.englishDescription,
            csvMethods,
            dbMethods: [],
            issue: 'missing_methods',
            severity: 'critical',
          });
        } else {
          // Compare individual methods
          const csvMethodTypes = new Set(csvMethods.map(m => m.method));
          const dbMethodTypes = new Set(dbMethods.map(m => m.method));
          
          // Use order-independent comparison for all method checks
          const comparisonResult = this.comparePortionMethods(csvMethods, dbMethods);
          
          if (!comparisonResult.match) {
            discrepancies.push({
              foodCode: csvFood.intake24Code,
              englishName: csvFood.englishDescription,
              localName: csvFood.localDescription || csvFood.englishDescription,
              csvMethods,
              dbMethods: dbMethods.map(m => ({
                method: m.method,
                conversion: m.conversion,
                description: m.description,
                order: m.order,
              })),
              issue: (comparisonResult.issue || 'method_mismatch') as 'missing_methods' | 'method_mismatch' | 'conversion_mismatch' | 'extra_methods',
              severity: (comparisonResult.severity || 'warning') as 'critical' | 'warning' | 'info',
            });
          }
        }
      }
      
      this.logger.info(`📏 Checked portion size consistency for ${foodsWithPortionSizes.length} foods`);
    } catch (error) {
      this.logger.error(`Failed to check portion size consistency: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return discrepancies;
  }

  /**
   * Parse portion size methods from CSV string
   */
  private parsePortionSizeMethods(methodString: string): Array<{method: string; conversion: number; parameters: Record<string, any>}> {
    if (!methodString || !methodString.trim()) {
      return [];
    }

    const normalized = methodString.replace(/\r\n/g, '\n').trim();
    const segments: string[] = [];
    const segmentRegex = /Method:[\s\S]*?(?=(?:\n\s*Method:)|$)/g;
    let match: RegExpExecArray | null;

    while ((match = segmentRegex.exec(normalized)) !== null) {
      segments.push(match[0].trim());
    }

    const methods: Array<{method: string; conversion: number; parameters: Record<string, any>}> = [];

    for (const segment of segments) {
      const tokens = segment
        .split(/(?:,|\n)+/)
        .map(token => token.trim())
        .filter(Boolean);

      let methodName: string | null = null;
      let conversionValue: number | null = null;
      const parameters: Record<string, any> = {};

      for (const token of tokens) {
        const [rawKey, ...rawValueParts] = token.split(':');
        if (!rawKey || rawValueParts.length === 0)
          continue;

        const key = rawKey.trim();
        const value = rawValueParts.join(':').trim();

        switch (key.toLowerCase()) {
          case 'method':
            methodName = value;
            break;
          case 'conversion': {
            const parsed = Number.parseFloat(value);
            if (!Number.isNaN(parsed))
              conversionValue = parsed;
            break;
          }
          default: {
            if (value.length === 0)
              break;
            if (/^[+-]?\d+(?:\.\d+)?$/.test(value)) {
              parameters[key] = Number.parseFloat(value);
            } else if (value === 'true' || value === 'false') {
              parameters[key] = value === 'true';
            } else {
              parameters[key] = value;
            }
          }
        }
      }

      if (methodName && conversionValue !== null) {
        methods.push({
          method: methodName,
          conversion: conversionValue,
          parameters,
        });
      }
    }

    return methods;
  }

  /**
   * Compare portion size methods in an order-independent way
   */
  private comparePortionMethods(
    csvMethods: Array<{method: string; conversion: number; parameters: Record<string, any>}>,
    dbMethods: Array<{method: string; conversion: number; description: string; order: number; parameters?: any}>
  ): {match: boolean; issue?: 'missing_methods' | 'method_mismatch' | 'conversion_mismatch' | 'extra_methods'; severity?: 'critical' | 'warning' | 'info'} {
    
    // Group methods by type for order-independent comparison
    const csvMethodGroups = this.groupMethodsByType(csvMethods);
    const dbMethodGroups = this.groupMethodsByType(dbMethods);
    
    // Check if all method types are present
    const csvTypes = new Set(Object.keys(csvMethodGroups));
    const dbTypes = new Set(Object.keys(dbMethodGroups));
    
    const missingTypes = [...csvTypes].filter(t => !dbTypes.has(t));
    const extraTypes = [...dbTypes].filter(t => !csvTypes.has(t));
    
    if (missingTypes.length > 0 || extraTypes.length > 0) {
      return {
        match: false,
        issue: 'method_mismatch',
        severity: missingTypes.length > 0 ? 'critical' : 'warning'
      };
    }
    
    // For each method type, check if conversions match (order-independent)
    for (const [methodType, csvMethodList] of Object.entries(csvMethodGroups)) {
      const dbMethodList = dbMethodGroups[methodType] || [];
      
      // Sort by conversion factor for comparison
      const csvConversions = csvMethodList.map(m => m.conversion).sort((a, b) => a - b);
      const dbConversions = dbMethodList.map(m => m.conversion).sort((a, b) => a - b);
      
      if (!this.areConversionListsEquivalent(csvConversions, dbConversions)) {
        return {
          match: false,
          issue: 'conversion_mismatch',
          severity: 'warning'
        };
      }
      
      // For guide-image and as-served methods, check parameters if available
      if (methodType === 'guide-image' || methodType === 'as-served') {
        if (!this.areParametersConsistent(csvMethodList, dbMethodList)) {
          return {
            match: false,
            issue: 'method_mismatch',
            severity: 'info'
          };
        }
      }
    }
    
    return {match: true};
  }

  /**
   * Group methods by their type
   */
  private groupMethodsByType(methods: Array<{method: string; [key: string]: any}>): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    for (const method of methods) {
      if (!groups[method.method]) {
        groups[method.method] = [];
      }
      groups[method.method].push(method);
    }
    
    return groups;
  }

  /**
   * Check if two lists of conversion factors are equivalent
   */
  private areConversionListsEquivalent(list1: number[], list2: number[]): boolean {
    if (list1.length !== list2.length) return false;
    
    // Use a more lenient tolerance for floating point comparison
    const TOLERANCE = 0.05; // 5% tolerance
    
    for (let i = 0; i < list1.length; i++) {
      const relativeError = Math.abs(list1[i] - list2[i]) / Math.max(list1[i], list2[i]);
      if (relativeError > TOLERANCE && Math.abs(list1[i] - list2[i]) > 0.01) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if parameters are consistent between CSV and DB methods
   */
  private areParametersConsistent(csvMethods: any[], dbMethods: any[]): boolean {
    // For now, just check counts match
    // In future, could validate specific parameter values if DB stores them
    return csvMethods.length === dbMethods.length;
  }

  /**
   * Normalize nutrient table names for comparison
   * Handles common naming variations between CSV and database
   */
  private normalizeNutrientTableName(tableName: string): string {
    if (!tableName) return '';
    
    // Common mappings - includes both directions for consistency
    const mappings: Record<string, string> = {
      'DCD for Japan': 'DCDJapan',
      'DCD_for_Japan': 'DCDJapan',
      'DCDforJapan': 'DCDJapan',
      'DCDJapan': 'DCDJapan', // Identity mapping for DB values
      'McCance': 'MCCANCE',
      'McCance and Widdowson': 'MCCANCE',
      'MCCANCE': 'MCCANCE', // Identity mapping
      'USDA SR': 'USDA_SR',
      'USDA-SR': 'USDA_SR',
      'USDA_SR': 'USDA_SR', // Identity mapping
    };
    
    // Check if there's a direct mapping
    if (mappings[tableName]) {
      return mappings[tableName];
    }
    
    // Otherwise, normalize by removing spaces and special characters
    return tableName
      .replace(/\s+for\s+/gi, '') // Remove "for" with spaces
      .replace(/\s+and\s+/gi, '_') // Replace "and" with underscore
      .replace(/\s+/g, '_') // Replace remaining spaces with underscores
      .replace(/[^\w]/g, ''); // Remove non-word characters
      // Note: Removed toUpperCase() to match database casing
  }

  /**
   * Check associated food consistency
   */
  private async checkAssociatedFoodConsistency(csvFoods: FoodRow[], dbFoods: DatabaseFood[], localeId: string): Promise<AssociatedFoodDiscrepancy[]> {
    const discrepancies: AssociatedFoodDiscrepancy[] = [];

    if (!this.database) {
      this.logger.warn('Database connection not available for associated food consistency check');
      return discrepancies;
    }

    const dbFoodMap = new Map(dbFoods.map(f => [f.code, f]));

    // Get all food codes that have associated foods in CSV (excluding action "1")
    const foodsWithAssociations = csvFoods.filter(f =>
      f.action !== '1' && f.associatedFood && f.associatedFood.trim() && dbFoodMap.has(f.intake24Code),
    );

    if (foodsWithAssociations.length === 0) {
      return discrepancies;
    }

    try {
      // Build query to get associated foods for all foods at once
      const foodCodes = foodsWithAssociations.map(f => f.intake24Code);
      const placeholders = foodCodes.map((_, index) => `$${index + 2}`).join(', ');

      const query = `
        SELECT
          af.food_code,
          af.locale_id,
          af.associated_food_code,
          af.associated_category_code,
          af.text,
          af.link_as_main,
          af.multiple,
          af.generic_name,
          af.order_by
        FROM associated_foods af
        WHERE af.locale_id = $1
        AND af.food_code IN (${placeholders})
        ORDER BY af.food_code, af.order_by
      `;

      const params = [localeId, ...foodCodes];
      const result = await this.database.foods.query(query, { bind: params }) as any;

      // Create a map of food code to associated foods
      const associatedFoodMap = new Map<string, Array<{
        associatedFoodCode: string | null;
        associatedCategoryCode: string | null;
        text: any;
        linkAsMain: boolean;
        multiple: boolean;
        order: number;
      }>>();

      if (result && result[0]) {
        for (const row of result[0]) {
          const associations = associatedFoodMap.get(row.food_code) || [];
          associations.push({
            associatedFoodCode: row.associated_food_code,
            associatedCategoryCode: row.associated_category_code,
            text: typeof row.text === 'string' ? JSON.parse(row.text) : row.text,
            linkAsMain: row.link_as_main,
            multiple: row.multiple,
            order: parseInt(row.order_by),
          });
          associatedFoodMap.set(row.food_code, associations);
        }
      }

      // Check each food for associated food consistency
      for (const csvFood of foodsWithAssociations) {
        const dbFood = dbFoodMap.get(csvFood.intake24Code);
        if (!dbFood) continue;

        // Parse CSV associated foods
        const csvAssociations = this.parseAssociatedFoods(csvFood.associatedFood);
        const dbAssociations = associatedFoodMap.get(csvFood.intake24Code) || [];

        // Compare associations
        if (csvAssociations.length === 0 && dbAssociations.length === 0) {
          continue; // Both empty, no discrepancy
        }

        if (dbAssociations.length === 0 && csvAssociations.length > 0) {
          // No associations in database
          discrepancies.push({
            foodCode: csvFood.intake24Code,
            englishName: csvFood.englishDescription,
            localName: csvFood.localDescription || csvFood.englishDescription,
            csvAssociatedFoods: csvAssociations,
            dbAssociatedFoods: [],
            issue: 'missing_associations',
            severity: 'critical',
          });
        } else {
          // Compare individual associations
          const csvCodes = new Set(csvAssociations.map(a => a.code));
          const dbCodes = new Set(
            dbAssociations.map(a => a.associatedFoodCode || a.associatedCategoryCode || '').filter(Boolean)
          );

          // Check for code mismatches
          const missingCodes = [...csvCodes].filter(c => !dbCodes.has(c));
          const extraCodes = [...dbCodes].filter(c => !csvCodes.has(c));

          if (missingCodes.length > 0 || extraCodes.length > 0) {
            discrepancies.push({
              foodCode: csvFood.intake24Code,
              englishName: csvFood.englishDescription,
              localName: csvFood.localDescription || csvFood.englishDescription,
              csvAssociatedFoods: csvAssociations,
              dbAssociatedFoods: dbAssociations,
              issue: missingCodes.length > 0 ? 'association_mismatch' : 'extra_associations',
              severity: missingCodes.length > 0 ? 'critical' : 'warning',
            });
          }
        }
      }

      this.logger.info(`🔗 Checked associated food consistency for ${foodsWithAssociations.length} foods`);
    } catch (error) {
      this.logger.error(`Failed to check associated food consistency: ${error instanceof Error ? error.message : String(error)}`);
    }

    return discrepancies;
  }

  /**
   * Parse associated foods from CSV string
   */
  private parseAssociatedFoods(associatedString: string): Array<{code: string; text: string; type: 'food' | 'category'}> {
    if (!associatedString || !associatedString.trim()) {
      return [];
    }

    const associations: Array<{code: string; text: string; type: 'food' | 'category'}> = [];

    const normalized = associatedString.replace(/\r\n/g, '\n');
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
      // Parse different formats:
      // 1. jpf7036({jp: ...}) - food code with localized text
      // 2. COND({jp: ...}) - category code with localized text
      // 3. Simple codes without text

      const foodMatch = part.match(/^([a-zA-Z0-9_]+)\((\{.+\})\)$/);
      if (foodMatch) {
        const code = foodMatch[1];
        const text = foodMatch[2];

        // Determine if it's a food or category based on the code pattern
        // Categories are typically uppercase (COND, CHIS, etc.)
        // Foods are typically lowercase with numbers (jpf7036)
        const type = /^[A-Z]+$/.test(code) ? 'category' : 'food';

        associations.push({ code, text, type });
      } else if (part) {
        // Simple code without text
        const type = /^[A-Z]+$/.test(part) ? 'category' : 'food';
        associations.push({ code: part, text: '', type });
      }
    }

    return associations;
  }

  /**
   * Check attribute consistency between CSV and database
   */
  private async checkAttributeConsistency(csvFoods: FoodRow[], dbFoods: DatabaseFood[]): Promise<AttributeDiscrepancy[]> {
    const discrepancies: AttributeDiscrepancy[] = [];
    const dbFoodMap = new Map(dbFoods.map(f => [f.code, f]));

    for (const csvFood of csvFoods) {
      // Skip foods with action "1" as they are excluded from DB
      if (csvFood.action === '1') {
        continue;
      }
      
      const dbFood = dbFoodMap.get(csvFood.intake24Code);
      if (!dbFood) continue;

      const attributes: AttributeDiscrepancy['attributes'] = {};
      let issueCount = 0;

      // Check Ready Meal Option
      const csvReadyMeal = this.parseBoolean(csvFood.readyMealOption);
      const dbReadyMeal = dbFood.attributes?.readyMealOption;
      // Only consider mismatch if DB has a defined value different from CSV
      const readyMealMatch = dbReadyMeal === undefined || csvReadyMeal === dbReadyMeal;
      if (!readyMealMatch) {
        attributes.readyMealOption = { csv: csvReadyMeal, db: dbReadyMeal, match: false };
        issueCount++;
      }

      // Check Same As Before Option
      const csvSameAsBefore = this.parseBoolean(csvFood.sameAsBeforeOption);
      const dbSameAsBefore = dbFood.attributes?.sameAsBeforeOption;
      // Only consider mismatch if DB has a defined value different from CSV
      const sameAsBeforeMatch = dbSameAsBefore === undefined || csvSameAsBefore === dbSameAsBefore;
      if (!sameAsBeforeMatch) {
        attributes.sameAsBeforeOption = { csv: csvSameAsBefore, db: dbSameAsBefore, match: false };
        issueCount++;
      }

      // Check Reasonable Amount (numeric field)
      const csvReasonableAmount = this.parseNumber(csvFood.reasonableAmount);
      const dbReasonableAmount = dbFood.attributes?.reasonableAmount;
      // Only consider mismatch if DB has a defined value different from CSV
      const reasonableAmountMatch = dbReasonableAmount === undefined || csvReasonableAmount === dbReasonableAmount;
      if (!reasonableAmountMatch && (csvReasonableAmount !== null || dbReasonableAmount !== null)) {
        attributes.reasonableAmount = { csv: csvReasonableAmount, db: dbReasonableAmount, match: false };
        issueCount++;
      }

      // Check Use In Recipes (numeric field)
      const csvUseInRecipes = this.parseNumber(csvFood.useInRecipes);
      const dbUseInRecipes = dbFood.attributes?.useInRecipes;
      // Only consider mismatch if DB has a defined value different from CSV
      const useInRecipesMatch = dbUseInRecipes === undefined || csvUseInRecipes === dbUseInRecipes;
      if (!useInRecipesMatch && (csvUseInRecipes !== null || dbUseInRecipes !== null)) {
        attributes.useInRecipes = { csv: csvUseInRecipes, db: dbUseInRecipes, match: false };
        issueCount++;
      }

      // Only add to discrepancies if there are actual issues
      if (issueCount > 0) {
        const severity: 'critical' | 'warning' | 'info' = 
          issueCount >= 3 ? 'critical' : 
          issueCount >= 2 ? 'warning' : 'info';

        discrepancies.push({
          foodCode: csvFood.intake24Code,
          englishName: csvFood.englishDescription,
          localName: csvFood.localDescription || csvFood.englishDescription,
          attributes,
          issueCount,
          severity,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Parse boolean value from CSV string
   */
  private parseBoolean(value: string): boolean {
    if (!value || value.trim() === '') return false;
    return value.toUpperCase() === 'TRUE';
  }

  /**
   * Parse number value from CSV string
   */
  private parseNumber(value: string): number | null {
    if (!value || value.trim() === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Parse category string into array
   */
  private parseCategories(categoryString: string): string[] {
    if (!categoryString)
      return [];
    return categoryString.split(',').map(cat => cat.trim()).filter(Boolean);
  }

  /**
   * Generate comprehensive consistency report
   */
  private generateReport(
    options: ConsistencyCheckOptions,
    csvFoods: FoodRow[],
    dbFoods: DatabaseFood[],
    categoryDiscrepancies: CategoryDiscrepancy[],
    nameDiscrepancies: NameDiscrepancy[],
    missingFoods: MissingFood[],
    nutrientDiscrepancies: NutrientDiscrepancy[],
    portionSizeDiscrepancies: PortionSizeDiscrepancy[],
    associatedFoodDiscrepancies: AssociatedFoodDiscrepancy[],
    attributeDiscrepancies: AttributeDiscrepancy[],
  ): ConsistencyReport {
    const totalChecked = csvFoods.length;
    const totalDiscrepancies = categoryDiscrepancies.length + nameDiscrepancies.length + missingFoods.length + nutrientDiscrepancies.length + portionSizeDiscrepancies.length + associatedFoodDiscrepancies.length + attributeDiscrepancies.length;
    const perfectMatches = totalChecked - totalDiscrepancies;
    const consistencyScore = Math.round((perfectMatches / totalChecked) * 100);

    // Determine quality grade
    let qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (consistencyScore >= 95)
      qualityGrade = 'A';
    else if (consistencyScore >= 85)
      qualityGrade = 'B';
    else if (consistencyScore >= 75)
      qualityGrade = 'C';
    else if (consistencyScore >= 65)
      qualityGrade = 'D';
    else qualityGrade = 'F';

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      categoryDiscrepancies,
      nameDiscrepancies,
      missingFoods,
      nutrientDiscrepancies,
      portionSizeDiscrepancies,
      associatedFoodDiscrepancies,
      attributeDiscrepancies,
    );

    const checksPerformed = [];
    if (options.checkCategories !== false)
      checksPerformed.push('categories');
    if (options.checkNames !== false)
      checksPerformed.push('names');
    checksPerformed.push('missing_foods');
    if (options.checkNutrients !== false)
      checksPerformed.push('nutrients');
    if (options.checkPortionSizes !== false)
      checksPerformed.push('portion_sizes');
    if (options.checkAssociatedFoods !== false)
      checksPerformed.push('associated_foods');
    if (options.checkAttributes !== false)
      checksPerformed.push('attributes');

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        inputFile: options.inputPath,
        localeId: options.localeId,
        totalCsvRows: csvFoods.length,
        totalDbFoods: dbFoods.length,
        checksPerformed,
      },
      summary: {
        totalChecked,
        perfectMatches,
        categoryDiscrepancies: categoryDiscrepancies.length,
        nameDiscrepancies: nameDiscrepancies.length,
        missingFoods: missingFoods.length,
        nutrientDiscrepancies: nutrientDiscrepancies.length,
        portionSizeDiscrepancies: portionSizeDiscrepancies.length,
        associatedFoodDiscrepancies: associatedFoodDiscrepancies.length,
        attributeDiscrepancies: attributeDiscrepancies.length,
        consistencyScore,
        qualityGrade,
      },
      discrepancies: {
        categories: categoryDiscrepancies,
        names: nameDiscrepancies,
        missing: missingFoods,
        nutrients: nutrientDiscrepancies,
        portionSizes: portionSizeDiscrepancies,
        associatedFoods: associatedFoodDiscrepancies,
        attributes: attributeDiscrepancies,
      },
      recommendations,
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    categoryDiscrepancies: CategoryDiscrepancy[],
    nameDiscrepancies: NameDiscrepancy[],
    missingFoods: MissingFood[],
    nutrientDiscrepancies: NutrientDiscrepancy[],
    portionSizeDiscrepancies: PortionSizeDiscrepancy[],
    associatedFoodDiscrepancies: AssociatedFoodDiscrepancy[],
    attributeDiscrepancies: AttributeDiscrepancy[],
  ): string[] {
    const recommendations: string[] = [];

    // Category recommendations
    const criticalCategoryIssues = categoryDiscrepancies.filter(d => d.severity === 'critical');
    if (criticalCategoryIssues.length > 0) {
      recommendations.push(
        `🚨 Critical: ${criticalCategoryIssues.length} foods have missing categories. Run category sync import to fix.`,
      );
    }

    const warningCategoryIssues = categoryDiscrepancies.filter(d => d.severity === 'warning');
    if (warningCategoryIssues.length > 0) {
      recommendations.push(
        `⚠️  Warning: ${warningCategoryIssues.length} foods have category discrepancies. Review and update as needed.`,
      );
    }

    // Missing food recommendations
    const missingGlobal = missingFoods.filter(f => f.reason === 'not_in_global');
    if (missingGlobal.length > 0) {
      recommendations.push(
        `📥 ${missingGlobal.length} foods need to be imported globally (action 4 or manual creation).`,
      );
    }

    const missingLocal = missingFoods.filter(f => f.reason === 'not_in_locale');
    if (missingLocal.length > 0) {
      recommendations.push(
        `🌏 ${missingLocal.length} global foods need to be added to ${missingFoods[0]?.foodCode ? 'the locale' : 'locale'} (action 2/3).`,
      );
    }

    // Name recommendations
    if (nameDiscrepancies.length > 0) {
      recommendations.push(
        `✏️  ${nameDiscrepancies.length} foods have name discrepancies. Review for typos or intentional differences.`,
      );
    }

    // Nutrient recommendations
    const missingNutrientMappings = nutrientDiscrepancies.filter(d => d.issue === 'missing_mapping');
    if (missingNutrientMappings.length > 0) {
      recommendations.push(
        `🔬 ${missingNutrientMappings.length} foods are missing nutrient table mappings. Run nutrient mapping import.`,
      );
    }

    const tableMismatches = nutrientDiscrepancies.filter(d => d.issue === 'table_mismatch');
    if (tableMismatches.length > 0) {
      recommendations.push(
        `⚠️  ${tableMismatches.length} foods have incorrect nutrient table assignments. Review and update mappings.`,
      );
    }

    const recordNotFound = nutrientDiscrepancies.filter(d => d.issue === 'record_not_found');
    if (recordNotFound.length > 0) {
      recommendations.push(
        `❌ ${recordNotFound.length} foods reference non-existent nutrient records. Update or import missing records.`,
      );
    }

    // Portion size recommendations
    const missingPortionMethods = portionSizeDiscrepancies.filter(d => d.issue === 'missing_methods');
    if (missingPortionMethods.length > 0) {
      recommendations.push(
        `📏 ${missingPortionMethods.length} foods are missing portion size methods. Run portion size import.`,
      );
    }

    const methodMismatches = portionSizeDiscrepancies.filter(d => d.issue === 'method_mismatch');
    if (methodMismatches.length > 0) {
      recommendations.push(
        `⚠️  ${methodMismatches.length} foods have incorrect portion size methods. Review and update methods.`,
      );
    }

    const conversionMismatches = portionSizeDiscrepancies.filter(d => d.issue === 'conversion_mismatch');
    if (conversionMismatches.length > 0) {
      recommendations.push(
        `🔢 ${conversionMismatches.length} foods have incorrect conversion factors. Update portion size data.`,
      );
    }

    // Associated food recommendations
    const missingAssociations = associatedFoodDiscrepancies.filter(d => d.issue === 'missing_associations');
    if (missingAssociations.length > 0) {
      recommendations.push(
        `🔗 ${missingAssociations.length} foods are missing associated food links. Import associated foods.`,
      );
    }

    const associationMismatches = associatedFoodDiscrepancies.filter(d => d.issue === 'association_mismatch');
    if (associationMismatches.length > 0) {
      recommendations.push(
        `⚠️  ${associationMismatches.length} foods have incorrect associated food references. Review associations.`,
      );
    }

    const extraAssociations = associatedFoodDiscrepancies.filter(d => d.issue === 'extra_associations');
    if (extraAssociations.length > 0) {
      recommendations.push(
        `🔄 ${extraAssociations.length} foods have extra associated foods in database. Review for removal.`,
      );
    }

    // Attribute recommendations
    const criticalAttributeIssues = attributeDiscrepancies.filter(d => d.severity === 'critical');
    if (criticalAttributeIssues.length > 0) {
      recommendations.push(
        `🚨 ${criticalAttributeIssues.length} foods have 3+ attribute mismatches. Run attribute sync import.`,
      );
    }

    const warningAttributeIssues = attributeDiscrepancies.filter(d => d.severity === 'warning');
    if (warningAttributeIssues.length > 0) {
      recommendations.push(
        `⚠️  ${warningAttributeIssues.length} foods have 2 attribute mismatches. Review and update attributes.`,
      );
    }

    const infoAttributeIssues = attributeDiscrepancies.filter(d => d.severity === 'info');
    if (infoAttributeIssues.length > 0) {
      recommendations.push(
        `ℹ️  ${infoAttributeIssues.length} foods have minor attribute discrepancies. Consider updating.`,
      );
    }

    // Overall recommendations
    if (recommendations.length === 0) {
      recommendations.push('🎉 Perfect consistency! Database matches CSV exactly.');
    }
    else {
      recommendations.push(
        `🔧 Use the CLI sync command for this locale (e.g. run 'pnpm --filter @intake24/cli cli:dev:tsx -- sync-foods --input-path <csv> --locale-id <locale>') to align categories with the source data.`,
      );
    }

    return recommendations;
  }

  /**
   * Save report to file in specified format
   */
  private async saveReport(
    report: ConsistencyReport,
    reportPath: string,
    format: 'csv' | 'json' | 'markdown',
  ): Promise<void> {
    const fullPath = resolve(reportPath);

    switch (format) {
      case 'json': {
        writeFileSync(fullPath, JSON.stringify(report, null, 2));
        break;
      }

      case 'markdown': {
        const markdown = this.generateMarkdownReport(report);
        writeFileSync(fullPath, markdown);
        break;
      }

      case 'csv': {
        const csv = this.generateCsvReport(report);
        writeFileSync(fullPath, csv);
        break;
      }
    }

    this.logger.info(`📄 Report saved to: ${fullPath}`);
  }

  /**
   * Generate markdown format report
   */
  private generateMarkdownReport(report: ConsistencyReport): string {
    const { metadata, summary, discrepancies, recommendations } = report;

    let markdown = `# Database-CSV Consistency Report\n\n`;
    markdown += `**Generated:** ${metadata.generatedAt}\n`;
    markdown += `**Input File:** ${metadata.inputFile}\n`;
    markdown += `**Locale:** ${metadata.localeId}\n\n`;

    markdown += `## Summary\n\n`;
    markdown += `- **Total Foods Checked:** ${summary.totalChecked}\n`;
    markdown += `- **Perfect Matches:** ${summary.perfectMatches}\n`;
    markdown += `- **Consistency Score:** ${summary.consistencyScore}% (Grade: ${summary.qualityGrade})\n`;
    markdown += `- **Category Issues:** ${summary.categoryDiscrepancies}\n`;
    markdown += `- **Name Issues:** ${summary.nameDiscrepancies}\n`;
    markdown += `- **Missing Foods:** ${summary.missingFoods}\n`;
    markdown += `- **Nutrient Issues:** ${summary.nutrientDiscrepancies}\n`;
    markdown += `- **Portion Size Issues:** ${summary.portionSizeDiscrepancies}\n`;
    markdown += `- **Associated Food Issues:** ${summary.associatedFoodDiscrepancies}\n`;
    markdown += `- **Attribute Issues:** ${summary.attributeDiscrepancies}\n\n`;

    if (recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      recommendations.forEach((rec) => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }

    if (discrepancies.categories.length > 0) {
      markdown += `## Category Discrepancies\n\n`;
      markdown += `| Food Code | Name | Severity | Missing | Extra |\n`;
      markdown += `|-----------|------|----------|---------|-------|\n`;
      discrepancies.categories.forEach((d) => {
        markdown += `| ${d.foodCode} | ${d.englishName} | ${d.severity} | ${d.missing.join(', ')} | ${d.extra.join(', ')} |\n`;
      });
      markdown += '\n';
    }

    if (discrepancies.nutrients.length > 0) {
      markdown += `## Nutrient Table Discrepancies\n\n`;
      markdown += `| Food Code | Name | Issue | CSV Table/Record | DB Table/Record |\n`;
      markdown += `|-----------|------|--------|------------------|------------------|\n`;
      discrepancies.nutrients.forEach((d) => {
        markdown += `| ${d.foodCode} | ${d.englishName} | ${d.issue} | ${d.csvTable}/${d.csvRecordId} | ${d.dbTable || 'N/A'}/${d.dbRecordId || 'N/A'} |\n`;
      });
      markdown += '\n';
    }

    if (discrepancies.portionSizes.length > 0) {
      markdown += `## Portion Size Method Discrepancies\n\n`;
      markdown += `| Food Code | Name | Issue | CSV Methods | DB Methods |\n`;
      markdown += `|-----------|------|--------|-------------|-------------|\n`;
      discrepancies.portionSizes.forEach((d) => {
        const csvMethodList = d.csvMethods.map(m => `${m.method}(${m.conversion})`).join(', ');
        const dbMethodList = d.dbMethods.map(m => `${m.method}(${m.conversion})`).join(', ');
        markdown += `| ${d.foodCode} | ${d.englishName} | ${d.issue} | ${csvMethodList} | ${dbMethodList || 'None'} |\n`;
      });
      markdown += '\n';
    }

    if (discrepancies.associatedFoods.length > 0) {
      markdown += `## Associated Food Discrepancies\n\n`;
      markdown += `| Food Code | Name | Issue | CSV Associations | DB Associations |\n`;
      markdown += `|-----------|------|--------|------------------|------------------|\n`;
      discrepancies.associatedFoods.forEach((d) => {
        const csvAssocList = d.csvAssociatedFoods.map(a => `${a.code}(${a.type})`).join(', ');
        const dbAssocList = d.dbAssociatedFoods.map(a => 
          `${a.associatedFoodCode || a.associatedCategoryCode || 'N/A'}(${a.associatedFoodCode ? 'food' : 'category'})`
        ).join(', ');
        markdown += `| ${d.foodCode} | ${d.englishName} | ${d.issue} | ${csvAssocList} | ${dbAssocList || 'None'} |\n`;
      });
      markdown += '\n';
    }

    if (discrepancies.attributes.length > 0) {
      markdown += `## Attribute Discrepancies\n\n`;
      markdown += `| Food Code | Name | Ready Meal | Same As Before | Reasonable Amount | Use In Recipes | Severity |\n`;
      markdown += `|-----------|------|------------|----------------|-------------------|----------------|----------|\n`;
      discrepancies.attributes.forEach((d) => {
        const readyMeal = d.attributes.readyMealOption 
          ? `CSV: ${d.attributes.readyMealOption.csv}, DB: ${d.attributes.readyMealOption.db}` 
          : 'Match';
        const sameAsBefore = d.attributes.sameAsBeforeOption 
          ? `CSV: ${d.attributes.sameAsBeforeOption.csv}, DB: ${d.attributes.sameAsBeforeOption.db}` 
          : 'Match';
        const reasonableAmount = d.attributes.reasonableAmount 
          ? `CSV: ${d.attributes.reasonableAmount.csv}, DB: ${d.attributes.reasonableAmount.db}` 
          : 'Match';
        const useInRecipes = d.attributes.useInRecipes 
          ? `CSV: ${d.attributes.useInRecipes.csv}, DB: ${d.attributes.useInRecipes.db}` 
          : 'Match';
        markdown += `| ${d.foodCode} | ${d.englishName} | ${readyMeal} | ${sameAsBefore} | ${reasonableAmount} | ${useInRecipes} | ${d.severity} |\n`;
      });
      markdown += '\n';
    }

    return markdown;
  }

  /**
   * Generate CSV format report
   */
  private generateCsvReport(report: ConsistencyReport): string {
    const lines = ['Food Code,Type,Issue,CSV Value,DB Value,Severity'];

    // Add category discrepancies
    report.discrepancies.categories.forEach((d) => {
      lines.push(`${d.foodCode},Category,Missing,"${d.csvCategories.join(', ')}","${d.dbCategories.join(', ')}",${d.severity}`);
    });

    // Add name discrepancies
    report.discrepancies.names.forEach((d) => {
      if (!d.englishMatch) {
        lines.push(`${d.foodCode},Name,English,"${d.csvEnglish}","${d.dbEnglish}",warning`);
      }
      if (!d.localMatch) {
        lines.push(`${d.foodCode},Name,Local,"${d.csvLocal}","${d.dbLocal}",warning`);
      }
    });

    // Add missing foods
    report.discrepancies.missing.forEach((d) => {
      lines.push(`${d.foodCode},Missing,${d.reason},"${d.englishName}","",critical`);
    });

    // Add nutrient discrepancies
    report.discrepancies.nutrients.forEach((d) => {
      lines.push(`${d.foodCode},Nutrient,${d.issue},"${d.csvTable}/${d.csvRecordId}","${d.dbTable || 'N/A'}/${d.dbRecordId || 'N/A'}",${d.severity}`);
    });

    // Add portion size discrepancies
    report.discrepancies.portionSizes.forEach((d) => {
      const csvMethods = d.csvMethods.map(m => `${m.method}(${m.conversion})`).join('; ');
      const dbMethods = d.dbMethods.map(m => `${m.method}(${m.conversion})`).join('; ');
      lines.push(`${d.foodCode},PortionSize,${d.issue},"${csvMethods}","${dbMethods}",${d.severity}`);
    });

    // Add associated food discrepancies
    report.discrepancies.associatedFoods.forEach((d) => {
      const csvAssociations = d.csvAssociatedFoods.map(a => `${a.code}(${a.type})`).join('; ');
      const dbAssociations = d.dbAssociatedFoods.map(a => 
        `${a.associatedFoodCode || a.associatedCategoryCode || 'N/A'}(${a.associatedFoodCode ? 'food' : 'category'})`
      ).join('; ');
      lines.push(`${d.foodCode},AssociatedFood,${d.issue},"${csvAssociations}","${dbAssociations}",${d.severity}`);
    });

    // Add attribute discrepancies
    report.discrepancies.attributes.forEach((d) => {
      if (d.attributes.readyMealOption) {
        lines.push(`${d.foodCode},Attribute,ReadyMealOption,"${d.attributes.readyMealOption.csv}","${d.attributes.readyMealOption.db}",${d.severity}`);
      }
      if (d.attributes.sameAsBeforeOption) {
        lines.push(`${d.foodCode},Attribute,SameAsBeforeOption,"${d.attributes.sameAsBeforeOption.csv}","${d.attributes.sameAsBeforeOption.db}",${d.severity}`);
      }
      if (d.attributes.reasonableAmount) {
        lines.push(`${d.foodCode},Attribute,ReasonableAmount,"${d.attributes.reasonableAmount.csv}","${d.attributes.reasonableAmount.db}",${d.severity}`);
      }
      if (d.attributes.useInRecipes) {
        lines.push(`${d.foodCode},Attribute,UseInRecipes,"${d.attributes.useInRecipes.csv}","${d.attributes.useInRecipes.db}",${d.severity}`);
      }
    });

    return lines.join('\n');
  }
}

/**
 * Main command function
 */
export default async function verifyConsistencyCommand(options: ConsistencyCheckOptions): Promise<void> {
  const checker = new ConsistencyChecker();

  console.log('🔍 Database-CSV Consistency Verification');
  console.log(`📋 Input: ${options.inputPath}`);
  console.log(`🌏 Locale: ${options.localeId}`);

  try {
    const report = await checker.verifyConsistency(options);

    // Display summary
    console.log('\n📊 CONSISTENCY SUMMARY');
    console.log(`├─ Total Foods: ${report.summary.totalChecked}`);
    console.log(`├─ Perfect Matches: ${report.summary.perfectMatches}`);
    console.log(`├─ Category Issues: ${report.summary.categoryDiscrepancies}`);
    console.log(`├─ Name Issues: ${report.summary.nameDiscrepancies}`);
    console.log(`├─ Missing Foods: ${report.summary.missingFoods}`);
    console.log(`├─ Nutrient Issues: ${report.summary.nutrientDiscrepancies}`);
    console.log(`├─ Portion Size Issues: ${report.summary.portionSizeDiscrepancies}`);
    console.log(`├─ Associated Food Issues: ${report.summary.associatedFoodDiscrepancies}`);
    console.log(`├─ Attribute Issues: ${report.summary.attributeDiscrepancies}`);
    console.log(`├─ Consistency Score: ${report.summary.consistencyScore}%`);
    console.log(`└─ Quality Grade: ${report.summary.qualityGrade}`);

    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      report.recommendations.forEach((rec, i) => {
        const prefix = i === report.recommendations.length - 1 ? '└─' : '├─';
        console.log(`${prefix} ${rec}`);
      });
    }

    console.log('\n✅ Consistency verification completed!');
  }
  catch (error) {
    console.error('❌ Consistency verification failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
