import type { Command } from 'commander';
import { createReadStream, existsSync } from 'node:fs';

import { dirname, join } from 'node:path';
import { Option } from 'commander';
import { parse } from 'csv-parse';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs-extra';
import { z } from 'zod';

import { logger as mainLogger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';
import { Database, databaseConfig } from '@intake24/db';

// CSV row schema
const csvRowSchema = z.object({
  'Intake24 code': z.string(),
  Action: z.string().optional(),
  'English description': z.string().optional(),
  'Local description': z.string().optional(),
  'Food composition table': z.string().optional(),
  'Food composition record ID': z.string().optional(),
  'Ready Meal Option': z.string().transform((val) => {
    if (val?.toUpperCase() === 'TRUE')
      return true;
    if (val?.toUpperCase() === 'FALSE')
      return false;
    return null;
  }),
  'Same As Before Option': z.string().transform((val) => {
    if (val?.toUpperCase() === 'TRUE')
      return true;
    if (val?.toUpperCase() === 'FALSE')
      return false;
    return null;
  }),
  'Reasonable Amount': z.string().optional(),
  'Use In Recipes': z.string().optional(),
});

type CSVRow = z.infer<typeof csvRowSchema>;

type AttributeName = 'readyMealOption' | 'sameAsBeforeOption';

type SkipReason = 'match' | 'csv-null' | 'food-missing';

interface SyncResult {
  foodCode: string;
  localDescription: string;
  csvValue: boolean | null;
  dbValue: boolean | null;
  attribute: AttributeName;
  action: 'update' | 'insert' | 'skip';
  status: 'success' | 'error' | 'skipped';
  reason?: SkipReason;
  error?: string;
}

class SyncFoodAttributesCommand {
  name = 'sync:food-attributes';
  description = 'Sync food attributes (ready meal, same as before) from CSV to database';

  async handler(csvFilePath: string, options: { dryRun?: boolean; verbose?: boolean; compareOnly?: boolean; progressInterval?: number; reportPath?: string; reportScope?: 'diffs' | 'all'; attributes?: string }) {
    const { dryRun = false, verbose = false, compareOnly = false, progressInterval = 500, reportPath, reportScope = 'diffs' } = options;
    const attributesToSync = (options.attributes ?? 'ready-meal')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    const doReadyMeal = attributesToSync.includes('ready-meal') || attributesToSync.includes('both');
    const doSameAsBefore = attributesToSync.includes('same-as-before') || attributesToSync.includes('both');

    console.log('🔄 Starting Ready Meal Options Sync');
    console.log(`CSV File: ${csvFilePath}`);
    console.log(`Mode: ${compareOnly ? 'COMPARE ONLY' : (dryRun ? 'DRY RUN' : 'LIVE UPDATE')}`);
    console.log();

    // Check if CSV file exists
    if (!existsSync(csvFilePath)) {
      console.error(`❌ CSV file not found: ${csvFilePath}`);
      process.exit(1);
    }

    const results: SyncResult[] = [];
    const csvData: CSVRow[] = [];

    // Parse CSV file
    await new Promise<void>((resolve, reject) => {
      createReadStream(csvFilePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }))
        .on('data', (row) => {
          try {
            const parsed = csvRowSchema.parse(row);
            if (parsed['Intake24 code'] && parsed['Intake24 code'] !== '') {
              csvData.push(parsed);
            }
          }
          catch {
            if (verbose) {
              console.warn(`⚠️ Skipping invalid row: ${JSON.stringify(row)}`);
            }
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`✅ Parsed ${csvData.length} food items from CSV`);
    console.log();

    // Initialize database connection
    const logger = mainLogger.child({ service: 'SyncReadyMealOptions' });
    const database = new Database({
      databaseConfig,
      logger,
      environment: (process.env.NODE_ENV || 'development') as Environment,
    });
    database.init();

    // Preload all relevant foods and attributes to avoid N+1 queries
    const codes = csvData.map(r => r['Intake24 code']);
    const foods = await database.foods.models.Food.findAll({
      where: { code: codes },
      attributes: ['code'],
    });
    const foodExists = new Set(foods.map(f => f.get('code') as string));

    const attrs = await database.foods.models.FoodAttribute.findAll({
      where: { foodCode: codes },
      attributes: ['foodCode', 'readyMealOption', 'sameAsBeforeOption'],
    });
    const attrByCode = new Map<string, { readyMealOption: boolean | null; sameAsBeforeOption: boolean | null }>(
      attrs.map(a => [
        a.get('foodCode') as string,
        {
          readyMealOption: a.get('readyMealOption') as boolean | null,
          sameAsBeforeOption: a.get('sameAsBeforeOption') as boolean | null,
        },
      ]),
    );

    // Process each food item
    let processed = 0;
    for (const row of csvData) {
      const foodCode = row['Intake24 code'];
      const csvReadyMealOption = row['Ready Meal Option'];
      const csvSameAsBeforeOption = row['Same As Before Option'];
      const localDescription = row['Local description'] || '';

      try {
        // Check if food exists in foods table (from preloaded set)
        if (!foodExists.has(foodCode)) {
          if (doReadyMeal) {
            results.push({
              foodCode,
              localDescription,
              csvValue: csvReadyMealOption,
              dbValue: null,
              attribute: 'readyMealOption',
              action: 'skip',
              status: 'skipped',
              reason: 'food-missing',
              error: 'Food code not found in foods table',
            });
          }
          if (doSameAsBefore) {
            results.push({
              foodCode,
              localDescription,
              csvValue: csvSameAsBeforeOption ?? null,
              dbValue: null,
              attribute: 'sameAsBeforeOption',
              action: 'skip',
              status: 'skipped',
              reason: 'food-missing',
              error: 'Food code not found in foods table',
            });
          }
          continue;
        }

        // Check current values in food_attributes
        const hasAttribute = attrByCode.has(foodCode);
        const existing = attrByCode.get(foodCode);
        const dbReadyMealOption = existing ? existing.readyMealOption : null;
        const dbSameAsBeforeOption = existing ? existing.sameAsBeforeOption : null;

        // Prepare pending changes for this food (only specified attributes)
        const pendingUpdate: Partial<Record<AttributeName, boolean | null>> = {};

        if (doReadyMeal && csvReadyMealOption !== undefined) {
          if (csvReadyMealOption === null) {
            results.push({
              foodCode,
              localDescription,
              csvValue: csvReadyMealOption,
              dbValue: dbReadyMealOption,
              attribute: 'readyMealOption',
              action: 'skip',
              status: 'skipped',
              reason: 'csv-null',
              error: 'CSV value is null',
            });
          }
          else if (dbReadyMealOption !== csvReadyMealOption) {
            pendingUpdate.readyMealOption = csvReadyMealOption;
          }
          else {
            results.push({
              foodCode,
              localDescription,
              csvValue: csvReadyMealOption,
              dbValue: dbReadyMealOption,
              attribute: 'readyMealOption',
              action: 'skip',
              status: 'skipped',
              reason: 'match',
            });
          }
        }

        if (doSameAsBefore && csvSameAsBeforeOption !== undefined) {
          if (csvSameAsBeforeOption === null) {
            results.push({
              foodCode,
              localDescription,
              csvValue: csvSameAsBeforeOption,
              dbValue: dbSameAsBeforeOption,
              attribute: 'sameAsBeforeOption',
              action: 'skip',
              status: 'skipped',
              reason: 'csv-null',
              error: 'CSV value is null',
            });
          }
          else if (dbSameAsBeforeOption !== csvSameAsBeforeOption) {
            pendingUpdate.sameAsBeforeOption = csvSameAsBeforeOption;
          }
          else {
            results.push({
              foodCode,
              localDescription,
              csvValue: csvSameAsBeforeOption,
              dbValue: dbSameAsBeforeOption,
              attribute: 'sameAsBeforeOption',
              action: 'skip',
              status: 'skipped',
              reason: 'match',
            });
          }
        }

        const hasPending = Object.keys(pendingUpdate).length > 0;
        if (hasPending) {
          const action: 'update' | 'insert' = hasAttribute ? 'update' : 'insert';
          const allowWrites = !dryRun && !compareOnly;
          if (allowWrites) {
            if (hasAttribute) {
              await database.foods.models.FoodAttribute.update(
                pendingUpdate,
                { where: { foodCode } },
              );
            }
            else {
              await database.foods.models.FoodAttribute.create({
                foodCode,
                readyMealOption: pendingUpdate.readyMealOption ?? null,
                sameAsBeforeOption: pendingUpdate.sameAsBeforeOption ?? null,
                reasonableAmount: null,
                useInRecipes: null,
              });
            }
          }

          if (pendingUpdate.readyMealOption !== undefined) {
            results.push({
              foodCode,
              localDescription,
              csvValue: pendingUpdate.readyMealOption,
              dbValue: dbReadyMealOption,
              attribute: 'readyMealOption',
              action,
              status: 'success',
            });
            if (!allowWrites && verbose) {
              const icon = action === 'update' ? '🔄' : '➕';
              console.log(`${icon} ${foodCode}: ${localDescription} [readyMealOption]`);
              console.log(`   CSV: ${String(pendingUpdate.readyMealOption)} | DB: ${String(dbReadyMealOption)} → ${String(pendingUpdate.readyMealOption)}`);
            }
          }
          if (pendingUpdate.sameAsBeforeOption !== undefined) {
            results.push({
              foodCode,
              localDescription,
              csvValue: pendingUpdate.sameAsBeforeOption,
              dbValue: dbSameAsBeforeOption,
              attribute: 'sameAsBeforeOption',
              action,
              status: 'success',
            });
            if (!allowWrites && verbose) {
              const icon = action === 'update' ? '🔄' : '➕';
              console.log(`${icon} ${foodCode}: ${localDescription} [sameAsBeforeOption]`);
              console.log(`   CSV: ${String(pendingUpdate.sameAsBeforeOption)} | DB: ${String(dbSameAsBeforeOption)} → ${String(pendingUpdate.sameAsBeforeOption)}`);
            }
          }
        }
      }
      catch (error) {
        results.push({
          foodCode,
          localDescription,
          csvValue: null,
          dbValue: null,
          attribute: 'readyMealOption',
          action: 'skip',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Progress indicator
      processed += 1;
      if (processed % progressInterval === 0) {
        console.log(`... processed ${processed}/${csvData.length}`);
      }
    }

    // Generate report
    console.log('📊 Sync Report');
    console.log('═'.repeat(80));

    const updates = results.filter(r => r.action === 'update' && r.status === 'success');
    const inserts = results.filter(r => r.action === 'insert' && r.status === 'success');
    const skipped = results.filter(r => r.status === 'skipped');
    const errors = results.filter(r => r.status === 'error');

    console.log(`✅ Updates: ${updates.length}`);
    console.log(`✅ Inserts: ${inserts.length}`);
    console.log(`⏭️  Skipped: ${skipped.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log();

    // Show discrepancies (or changes if live update)
    if (updates.length > 0 || inserts.length > 0) {
      const allowWrites = !dryRun && !compareOnly;
      console.log(`📝 ${allowWrites ? 'Changes Made' : 'Differences Found'}:`);
      console.log('─'.repeat(80));

      [...updates, ...inserts].forEach((result) => {
        const icon = result.action === 'update' ? '🔄' : '➕';
        console.log(`${icon} ${result.foodCode}: ${result.localDescription} [${result.attribute}]`);
        console.log(`   CSV: ${String(result.csvValue)} | DB: ${String(result.dbValue)} → ${String(result.csvValue)}`);
      });
      console.log();
    }

    // Show errors if any
    if (errors.length > 0 && verbose) {
      console.log('❌ Errors:');
      console.log('─'.repeat(80));
      errors.forEach((result) => {
        console.log(`❌ ${result.foodCode}: ${result.error}`);
      });
      console.log();
    }

    // Show summary of skipped items with NULL values in CSV
    const nullInCsv = skipped.filter(r => r.reason === 'csv-null');
    if (nullInCsv.length > 0 && verbose) {
      console.log('⚠️ Items with NULL in CSV (not updated):');
      nullInCsv.forEach((r) => {
        console.log(`   ${r.foodCode}: ${r.localDescription} [${r.attribute}]`);
      });
      console.log();
    }

    // Close database connection
    await database.close();

    // Write report if requested
    if (reportPath) {
      try {
        const rows = (reportScope === 'all')
          ? results
          : results.filter(r => (r.status === 'success'));

        // Resolve final report path
        const defaultName = `food-attributes-${compareOnly ? 'diffs' : 'results'}-${new Date()
          .toISOString()
          .replace(/[:.]/g, '')
          .replace('T', '_')
          .slice(0, 15)}.csv`;

        let finalPath = reportPath;

        // If path is root or clearly invalid, default under CWD/reports
        if (finalPath === '/' || finalPath.trim() === '') {
          finalPath = join(process.cwd(), 'reports', defaultName);
        }

        // If path exists and is a directory, append filename
        else if (await fs.pathExists(finalPath)) {
          const stats = await fs.stat(finalPath);
          if (stats.isDirectory())
            finalPath = join(finalPath, defaultName);
        }
        // If a trailing slash is provided, treat as directory
        else if (finalPath.endsWith('/')) {
          finalPath = join(finalPath, defaultName);
        }

        // Ensure directory exists
        await fs.ensureDir(dirname(finalPath));

        const csvWriter = createObjectCsvWriter({
          path: finalPath,
          header: [
            { id: 'foodCode', title: 'food_code' },
            { id: 'localDescription', title: 'local_description' },
            { id: 'attribute', title: 'attribute' },
            { id: 'reason', title: 'reason' },
            { id: 'csvValue', title: 'csv_value' },
            { id: 'dbValue', title: 'db_value' },
            { id: 'action', title: 'action' },
            { id: 'status', title: 'status' },
            { id: 'error', title: 'error' },
          ],
        });

        await csvWriter.writeRecords(rows.map(r => ({
          ...r,
          csvValue: r.csvValue === null ? '' : String(r.csvValue),
          dbValue: r.dbValue === null ? '' : String(r.dbValue),
        })));

        console.log(`💾 Report written: ${finalPath} (${rows.length} rows, scope=${reportScope})`);
      }
      catch (err) {
        console.error('❌ Failed to write report:', err);
      }
    }

    if (compareOnly)
      console.log('🔍 COMPARE ONLY COMPLETE - No changes were made to the database');
    else if (dryRun)
      console.log('🔍 DRY RUN COMPLETE - No changes were made to the database');
    else
      console.log('✅ SYNC COMPLETE - Database has been updated');
  }

  command(program: Command) {
    return program
      .command(this.name)
      .description(this.description)
      .argument('<csv-file>', 'Path to the CSV file containing ready meal options')
      .option('--dry-run', 'Run without making changes to the database', false)
      .option('--compare-only', 'Only compare and report differences; never write to DB', false)
      .option('--progress-interval <n>', 'Log progress every N items (default: 500)', v => Number.parseInt(v, 10), 500)
      .option('--report-path <path>', 'Write results to CSV at path')
      .addOption(new Option('--report-scope <scope>', 'Which results to include in report (diffs|all)').choices(['diffs', 'all']).default('diffs'))
      .option('--attributes <list>', 'Attributes to sync: ready-meal, same-as-before, both (comma-separated)', 'ready-meal')
      .option('--verbose', 'Show detailed output including skipped items', false)
      .action(async (csvFile: string, options: any) => {
        try {
          await this.handler(csvFile, options);
        }
        catch (error) {
          console.error('Error:', error);
          process.exit(1);
        }
      });
  }
}

export default new SyncFoodAttributesCommand();
