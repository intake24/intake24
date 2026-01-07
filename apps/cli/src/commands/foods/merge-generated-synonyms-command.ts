import type { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { logger as mainLogger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';
import { Database, databaseConfig } from '@intake24/db';

interface GeneratedSynonymGroup {
  foodCode: string;
  canonical: string;
  terms: string[];
}

interface MergeResult {
  foodCode: string;
  action: 'merged' | 'created' | 'skipped' | 'error';
  existingSynonyms: number;
  addedSynonyms: number;
  totalSynonyms: number;
  error?: string;
}

const JAPANESE_LOCALE = 'jp_JP_2024';
const LANGUAGE_KEY = 'ja';

class MergeGeneratedSynonymsCommand {
  name = 'merge:generated-synonyms';
  description = 'Merge generated synonyms from JSON file into food_locals.alt_names for Japanese locale';

  async handler(options: { dryRun?: boolean; verbose?: boolean; jsonPath?: string }) {
    const { dryRun = false, verbose = false } = options;

    console.log('🔄 Merging Generated Synonyms into Database');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`Locale: ${JAPANESE_LOCALE}`);
    console.log(`Language Key: ${LANGUAGE_KEY}`);
    console.log();

    // Load generated synonyms JSON
    const jsonPath = options.jsonPath || resolve(process.cwd(), 'data/japanese/generated_synonyms.json');
    console.log(`Loading synonyms from: ${jsonPath}`);

    let generatedSynonyms: GeneratedSynonymGroup[];
    try {
      const content = readFileSync(jsonPath, 'utf-8');
      generatedSynonyms = JSON.parse(content) as GeneratedSynonymGroup[];
      console.log(`✅ Loaded ${generatedSynonyms.length} synonym groups`);
    }
    catch (error) {
      console.error(`❌ Failed to load synonyms JSON: ${error}`);
      process.exit(1);
    }

    // Initialize database connection
    const logger = mainLogger.child({ service: 'MergeGeneratedSynonyms' });
    const database = new Database({
      databaseConfig,
      logger,
      environment: (process.env.NODE_ENV || 'development') as Environment,
    });
    database.init();

    const results: MergeResult[] = [];

    // Get all food codes from generated synonyms
    const foodCodes = generatedSynonyms.map(g => g.foodCode);

    // Fetch all existing food_locals records for the Japanese locale
    const existingFoodLocals = await database.foods.models.FoodLocal.findAll({
      where: {
        foodCode: foodCodes,
        localeId: JAPANESE_LOCALE,
      },
      attributes: ['id', 'foodCode', 'altNames'],
    });

    const foodLocalByCode = new Map(
      existingFoodLocals.map(fl => [fl.get('foodCode') as string, fl]),
    );

    console.log(`Found ${existingFoodLocals.length} matching food_locals records`);
    console.log();

    // Process each synonym group
    let processed = 0;
    let merged = 0;
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const group of generatedSynonyms) {
      const { foodCode, canonical, terms } = group;

      try {
        const foodLocal = foodLocalByCode.get(foodCode);

        if (!foodLocal) {
          results.push({
            foodCode,
            action: 'skipped',
            existingSynonyms: 0,
            addedSynonyms: 0,
            totalSynonyms: 0,
            error: `No food_locals record found for locale ${JAPANESE_LOCALE}`,
          });
          skipped++;
          continue;
        }

        // Get existing altNames
        const existingAltNames = (foodLocal.get('altNames') as Record<string, string[]>) || {};
        const existingSynonymsForLang = existingAltNames[LANGUAGE_KEY] || [];

        // Combine generated synonyms (canonical + terms)
        const generatedTerms = [canonical, ...terms].filter(Boolean);

        // Merge: add generated terms that don't already exist
        const existingSet = new Set(existingSynonymsForLang.map(s => s.toLowerCase().trim()));
        const newTerms: string[] = [];

        for (const term of generatedTerms) {
          const normalized = term.toLowerCase().trim();
          if (!existingSet.has(normalized)) {
            newTerms.push(term);
            existingSet.add(normalized);
          }
        }

        if (newTerms.length === 0) {
          results.push({
            foodCode,
            action: 'skipped',
            existingSynonyms: existingSynonymsForLang.length,
            addedSynonyms: 0,
            totalSynonyms: existingSynonymsForLang.length,
            error: 'All synonyms already exist',
          });
          skipped++;
          continue;
        }

        // Build updated altNames
        const updatedSynonyms = [...existingSynonymsForLang, ...newTerms];
        const updatedAltNames = {
          ...existingAltNames,
          [LANGUAGE_KEY]: updatedSynonyms,
        };

        const action = existingSynonymsForLang.length > 0 ? 'merged' : 'created';

        if (!dryRun) {
          await foodLocal.update({ altNames: updatedAltNames });
        }

        results.push({
          foodCode,
          action,
          existingSynonyms: existingSynonymsForLang.length,
          addedSynonyms: newTerms.length,
          totalSynonyms: updatedSynonyms.length,
        });

        if (action === 'merged') {
          merged++;
        }
        else {
          created++;
        }

        if (verbose) {
          const icon = action === 'merged' ? '🔄' : '➕';
          console.log(`${icon} ${foodCode}: +${newTerms.length} synonyms (${existingSynonymsForLang.length} → ${updatedSynonyms.length})`);
          if (newTerms.length <= 5) {
            console.log(`   Added: ${newTerms.join(', ')}`);
          }
          else {
            console.log(`   Added: ${newTerms.slice(0, 5).join(', ')}... and ${newTerms.length - 5} more`);
          }
        }
      }
      catch (error) {
        results.push({
          foodCode,
          action: 'error',
          existingSynonyms: 0,
          addedSynonyms: 0,
          totalSynonyms: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errors++;
      }

      processed++;
      if (processed % 500 === 0) {
        console.log(`... processed ${processed}/${generatedSynonyms.length}`);
      }
    }

    // Summary
    console.log();
    console.log('📊 Merge Report');
    console.log('═'.repeat(60));
    console.log(`Total processed: ${processed}`);
    console.log(`✅ Merged (added to existing): ${merged}`);
    console.log(`➕ Created (new altNames): ${created}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log();

    // Stats
    const successful = results.filter(r => r.action === 'merged' || r.action === 'created');
    const totalAdded = successful.reduce((sum, r) => sum + r.addedSynonyms, 0);
    console.log(`📈 Total synonyms added: ${totalAdded}`);

    // Close database connection
    await database.close();

    if (dryRun) {
      console.log();
      console.log('🔍 DRY RUN COMPLETE - No changes were made to the database');
      console.log('Run without --dry-run to apply changes');
    }
    else {
      console.log();
      console.log('✅ MERGE COMPLETE - Database has been updated');
      console.log();
      console.log('⚠️  Next steps:');
      console.log('   1. Run opensearch-migrate to rebuild the search index');
      console.log('   2. Verify synonyms appear in the admin UI');
    }
  }

  command(program: Command) {
    return program
      .command(this.name)
      .description(this.description)
      .option('--dry-run', 'Run without making changes to the database', false)
      .option('--verbose', 'Show detailed output for each food', false)
      .option('--json-path <path>', 'Path to generated synonyms JSON (default: data/japanese/generated_synonyms.json)')
      .action(async (options: any) => {
        try {
          await this.handler(options);
        }
        catch (error) {
          console.error('Error:', error);
          process.exit(1);
        }
      });
  }
}

export default new MergeGeneratedSynonymsCommand();
