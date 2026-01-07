import type { Command } from 'commander';

import { logger as mainLogger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';
import { Database, databaseConfig } from '@intake24/db';

interface MigrationResult {
  foodCode: string;
  action: 'migrated' | 'skipped' | 'error';
  synonymsMoved: number;
  brandsMoved: number;
  error?: string;
}

/**
 * Migration command to fix altNames data structure in Japanese locale.
 *
 * The import-foods command incorrectly stored:
 * - synonyms under altNames.synonyms instead of altNames.ja
 * - brand names under altNames.brands instead of the brands table
 *
 * This migration:
 * 1. Merges altNames.synonyms into altNames.ja (deduplicating)
 * 2. Moves altNames.brands to the brands table
 * 3. Removes the 'synonyms' and 'brands' keys from altNames
 */
class MigrateAltNamesCommand {
  name = 'migrate:alt-names';
  description = 'Fix altNames data structure - move synonyms to language key, brands to brands table';

  async handler(options: { dryRun?: boolean; verbose?: boolean; locale?: string }) {
    const { dryRun = false, verbose = false, locale = 'jp_JP_2024' } = options;

    console.log('🔄 Migrating altNames Data Structure');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`Locale: ${locale}`);
    console.log();

    // Initialize database connection
    const logger = mainLogger.child({ service: 'MigrateAltNames' });
    const database = new Database({
      databaseConfig,
      logger,
      environment: (process.env.NODE_ENV || 'development') as Environment,
    });
    database.init();

    // Get language code from locale (e.g., jp_JP_2024 -> ja)
    const languageCode = this.getLanguageCode(locale);
    console.log(`Language code for synonyms: ${languageCode}`);
    console.log();

    const results: MigrationResult[] = [];

    // Fetch all food_locals records for this locale with altNames containing 'synonyms' or 'brands'
    const foodLocals = await database.foods.models.FoodLocal.findAll({
      where: {
        localeId: locale,
      },
      attributes: ['id', 'foodCode', 'altNames'],
    });

    console.log(`Found ${foodLocals.length} food_locals records for locale ${locale}`);

    // Filter to those with synonyms or brands keys
    const foodsToMigrate = foodLocals.filter((fl) => {
      const altNames = (fl.get('altNames') as Record<string, string[]>) || {};
      return 'synonyms' in altNames || 'brands' in altNames;
    });

    console.log(`Foods requiring migration: ${foodsToMigrate.length}`);
    console.log();

    let processed = 0;
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    let totalSynonymsMoved = 0;
    let totalBrandsMoved = 0;

    for (const foodLocal of foodsToMigrate) {
      const foodCode = foodLocal.get('foodCode') as string;
      const _foodLocalId = foodLocal.get('id') as string;

      try {
        const altNames = (foodLocal.get('altNames') as Record<string, string[]>) || {};
        const synonymsFromKey = altNames.synonyms || [];
        const brandsFromKey = altNames.brands || [];
        const existingLangSynonyms = altNames[languageCode] || [];

        // Skip if nothing to migrate
        if (synonymsFromKey.length === 0 && brandsFromKey.length === 0) {
          results.push({
            foodCode,
            action: 'skipped',
            synonymsMoved: 0,
            brandsMoved: 0,
            error: 'No synonyms or brands to migrate',
          });
          skipped++;
          continue;
        }

        // Build new altNames - merge synonyms into language key
        const mergedSynonyms = this.deduplicateStrings([
          ...existingLangSynonyms,
          ...synonymsFromKey,
        ]);

        const newAltNames: Record<string, string[]> = {};

        // Copy existing language keys (except 'synonyms' and 'brands')
        for (const [key, values] of Object.entries(altNames)) {
          if (key !== 'synonyms' && key !== 'brands') {
            newAltNames[key] = values;
          }
        }

        // Set the merged synonyms under the language code
        if (mergedSynonyms.length > 0) {
          newAltNames[languageCode] = mergedSynonyms;
        }

        const synonymsMoved = synonymsFromKey.length;
        const brandsMoved = brandsFromKey.length;

        if (!dryRun) {
          // Update altNames
          await foodLocal.update({ altNames: newAltNames });

          // Insert brands into brands table (if any)
          if (brandsFromKey.length > 0) {
            // Check for existing brands to avoid duplicates
            const existingBrands = await database.foods.models.Brand.findAll({
              where: {
                foodCode,
                localeId: locale,
              },
              attributes: ['name'],
            });

            const existingBrandNames = new Set(
              existingBrands.map(b => (b.get('name') as string).toLowerCase()),
            );

            const newBrands = brandsFromKey.filter(
              brand => !existingBrandNames.has(brand.toLowerCase()),
            );

            if (newBrands.length > 0) {
              await database.foods.models.Brand.bulkCreate(
                newBrands.map(name => ({
                  foodCode,
                  localeId: locale,
                  name,
                })),
              );
            }
          }
        }

        results.push({
          foodCode,
          action: 'migrated',
          synonymsMoved,
          brandsMoved,
        });

        migrated++;
        totalSynonymsMoved += synonymsMoved;
        totalBrandsMoved += brandsMoved;

        if (verbose) {
          console.log(`✅ ${foodCode}: moved ${synonymsMoved} synonyms, ${brandsMoved} brands`);
        }
      }
      catch (error) {
        results.push({
          foodCode,
          action: 'error',
          synonymsMoved: 0,
          brandsMoved: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errors++;
        console.error(`❌ ${foodCode}: ${error}`);
      }

      processed++;
      if (processed % 500 === 0) {
        console.log(`... processed ${processed}/${foodsToMigrate.length}`);
      }
    }

    // Summary
    console.log();
    console.log('📊 Migration Report');
    console.log('═'.repeat(60));
    console.log(`Total processed: ${processed}`);
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log();
    console.log(`📈 Total synonyms moved to '${languageCode}' key: ${totalSynonymsMoved}`);
    console.log(`📈 Total brands moved to brands table: ${totalBrandsMoved}`);

    // Close database connection
    await database.close();

    if (dryRun) {
      console.log();
      console.log('🔍 DRY RUN COMPLETE - No changes were made to the database');
      console.log('Run without --dry-run to apply changes');
    }
    else {
      console.log();
      console.log('✅ MIGRATION COMPLETE - Database has been updated');
      console.log();
      console.log('⚠️  Next steps:');
      console.log('   1. Run opensearch-migrate to rebuild the search index');
      console.log('   2. Verify the admin UI shows correct language tabs');
    }
  }

  private getLanguageCode(locale: string): string {
    // Map locales to their language codes
    const localeToLanguage: Record<string, string> = {
      jp_JP_2024: 'ja',
      en_GB: 'en',
      en_AU: 'en',
      en_NZ: 'en',
      // Add more as needed
    };

    return localeToLanguage[locale] || locale.split('_')[0];
  }

  private deduplicateStrings(strings: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const str of strings) {
      const normalized = str.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(str);
      }
    }

    return result;
  }

  command(program: Command) {
    return program
      .command(this.name)
      .description(this.description)
      .option('--dry-run', 'Run without making changes to the database', false)
      .option('--verbose', 'Show detailed output for each food', false)
      .option('-l, --locale <locale>', 'Target locale (default: jp_JP_2024)', 'jp_JP_2024')
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

export default new MigrateAltNamesCommand();
