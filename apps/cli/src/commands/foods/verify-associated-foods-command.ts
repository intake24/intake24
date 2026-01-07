import type { Command } from 'commander';

import { logger as mainLogger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';
import { Database, databaseConfig } from '@intake24/db';

interface VerifyOptions {
  foodCode?: string;
  verbose?: boolean;
  showAll?: boolean;
}

class VerifyAssociatedFoodsCommand {
  name = 'verify:associated-foods';
  description = 'Verify associated foods integrity for a locale - helps debug AL-19 issue';

  async handler(localeCode: string, options: VerifyOptions) {
    const { foodCode, verbose = false, showAll = false } = options;

    console.log('🔍 Verifying Associated Foods Integrity');
    console.log(`Locale: ${localeCode}`);
    if (foodCode)
      console.log(`Food code filter: ${foodCode}`);
    console.log();

    // Initialize database connection
    const logger = mainLogger.child({ service: 'VerifyAssociatedFoods' });
    const database = new Database({
      databaseConfig,
      logger,
      environment: (process.env.NODE_ENV || 'development') as Environment,
    });
    database.init();

    try {
      // Build query conditions
      const whereClause: any = { localeId: localeCode };
      if (foodCode) {
        whereClause.foodCode = foodCode;
      }

      // Get all foods for this locale
      const foods = await database.foods.models.FoodLocal.findAll({
        where: whereClause,
        attributes: ['id', 'foodCode', 'name'],
        include: [
          {
            association: 'associatedFoods',
            required: false,
          },
        ],
        order: [['foodCode', 'ASC']],
      });

      console.log(`Found ${foods.length} food(s) in locale ${localeCode}`);
      console.log();

      // Categorize foods
      const foodsWithAssociations = foods.filter(
        food => food.get('associatedFoods') && (food.get('associatedFoods') as any[]).length > 0,
      );
      const foodsWithoutAssociations = foods.filter(
        food => !food.get('associatedFoods') || (food.get('associatedFoods') as any[]).length === 0,
      );

      console.log('📊 Summary:');
      console.log('═'.repeat(60));
      console.log(`✅ Foods with associated foods: ${foodsWithAssociations.length}`);
      console.log(`⚠️  Foods without associated foods: ${foodsWithoutAssociations.length}`);
      console.log();

      // Show foods with associations
      if (foodsWithAssociations.length > 0 && (verbose || showAll)) {
        console.log('✅ Foods WITH associated foods:');
        console.log('─'.repeat(60));
        for (const food of foodsWithAssociations) {
          const assocFoods = food.get('associatedFoods') as any[];
          console.log(`  ${food.get('foodCode')}: ${food.get('name')} (${assocFoods.length} associations)`);
          if (verbose) {
            for (const assoc of assocFoods) {
              const target = assoc.get('associatedFoodCode') || assoc.get('associatedCategoryCode');
              const type = assoc.get('associatedFoodCode') ? 'food' : 'category';
              console.log(`    → ${type}: ${target} | "${assoc.get('text') || ''}"`);
            }
          }
        }
        console.log();
      }

      // Show foods without associations (potential issues)
      if (foodsWithoutAssociations.length > 0) {
        const displayLimit = showAll ? foodsWithoutAssociations.length : Math.min(20, foodsWithoutAssociations.length);
        console.log(`⚠️  Foods WITHOUT associated foods (showing ${displayLimit} of ${foodsWithoutAssociations.length}):`);
        console.log('─'.repeat(60));
        for (const food of foodsWithoutAssociations.slice(0, displayLimit)) {
          console.log(`  ${food.get('foodCode')}: ${food.get('name')}`);
        }
        if (!showAll && foodsWithoutAssociations.length > 20) {
          console.log(`  ... and ${foodsWithoutAssociations.length - 20} more`);
        }
        console.log();
      }

      // If specific food code was requested, show detailed info
      if (foodCode && foods.length > 0) {
        const food = foods[0];
        console.log('📋 Detailed Food Info:');
        console.log('═'.repeat(60));
        console.log(`Food Code: ${food.get('foodCode')}`);
        console.log(`Local ID: ${food.get('id')}`);
        console.log(`Name: ${food.get('name')}`);
        console.log(`Locale: ${localeCode}`);

        const assocFoods = food.get('associatedFoods') as any[];
        console.log(`Associated Foods Count: ${assocFoods?.length ?? 0}`);

        if (assocFoods && assocFoods.length > 0) {
          console.log();
          console.log('Associated Foods:');
          for (const assoc of assocFoods) {
            console.log(`  ID: ${assoc.get('id')}`);
            console.log(`    Food Code: ${assoc.get('associatedFoodCode') || 'N/A'}`);
            console.log(`    Category Code: ${assoc.get('associatedCategoryCode') || 'N/A'}`);
            console.log(`    Text: ${assoc.get('text') || 'N/A'}`);
            console.log(`    Generic Name: ${assoc.get('genericName') || 'N/A'}`);
            console.log(`    Link As Main: ${assoc.get('linkAsMain')}`);
            console.log(`    Multiple: ${assoc.get('multiple')}`);
            console.log(`    Order: ${assoc.get('orderBy')}`);
            console.log();
          }
        }
        else {
          console.log();
          console.log('⚠️  No associated foods found for this food.');
          console.log('   This may be the AL-19 bug - associated foods were deleted');
          console.log('   when the form submitted an empty array.');
        }
      }

      await database.close();
      console.log('✅ Verification complete');
    }
    catch (error) {
      console.error('❌ Error:', error);
      await database.close();
      process.exit(1);
    }
  }

  command(program: Command) {
    return program
      .command(this.name)
      .description(this.description)
      .argument('<locale-code>', 'Locale code to check (e.g., jp_JP_2024)')
      .option('-f, --food-code <code>', 'Specific food code to check')
      .option('-v, --verbose', 'Show detailed output including association details', false)
      .option('-a, --show-all', 'Show all foods (no limit)', false)
      .action(async (localeCode: string, options: VerifyOptions) => {
        try {
          await this.handler(localeCode, options);
        }
        catch (error) {
          console.error('Error:', error);
          process.exit(1);
        }
      });
  }
}

export default new VerifyAssociatedFoodsCommand();
