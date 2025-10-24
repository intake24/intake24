import type { ClientOptions } from '@opensearch-project/opensearch';
import * as path from 'node:path';
import { Client } from '@opensearch-project/opensearch';
import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import wanakana from 'wanakana';

// Load environment variables
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../api/.env'),
  path.resolve(process.cwd(), '../../apps/api/.env'),
  path.resolve(__dirname, '../../../../api/.env'),
];

for (const envPath of possiblePaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✓ Loaded environment from: ${envPath}`);
    break;
  }
}

export interface OpenSearchMigrateArguments {
  locale: string;
  batchSize: number;
  recreateIndex: boolean;
}

const opensearchMigrate = {
  handler: async (args: OpenSearchMigrateArguments): Promise<void> => {
    const { locale, batchSize, recreateIndex } = args;

    console.log(`🔍 Starting OpenSearch migration for locale: ${locale}`);
    console.log(`   Batch size: ${batchSize}`);
    console.log(`   Recreate index: ${recreateIndex}`);

    if (locale !== 'jp_JP_2024') {
      console.error(`❌ Locale ${locale} is not supported. Currently only jp_JP_2024 is supported.`);
      process.exit(1);
    }

    // Import opensearchConfig after environment variables are loaded
    const opensearchConfig = await import('../../../../api/src/config/opensearch').then(m => m.default);

    // OpenSearch configuration - using central config as single source of truth
    const opensearchConfigLocal = {
      host: opensearchConfig.host,
      username: opensearchConfig.username,
      password: opensearchConfig.password,
      indexName: opensearchConfig.japaneseIndex, // Use index name from central config
    };

    console.log('OpenSearch Config:', {
      host: opensearchConfigLocal.host,
      username: opensearchConfigLocal.username,
      password: opensearchConfigLocal.password ? '***' : 'NOT SET',
      indexName: opensearchConfigLocal.indexName,
    });

    if (!opensearchConfigLocal.username || !opensearchConfigLocal.password) {
      console.error('❌ OpenSearch credentials not found in environment variables');
      console.log('Please set OPENSEARCH_USERNAME and OPENSEARCH_PASSWORD in your .env file');
      process.exit(1);
    }

    // Database configuration
    const dbConfig: any = {
      host: process.env.DB_FOODS_HOST || process.env.DB_DEV_FOODS_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_FOODS_PORT || process.env.DB_DEV_FOODS_PORT || '5432', 10),
      database: process.env.DB_FOODS_DATABASE || process.env.DB_DEV_FOODS_DATABASE || 'intake24_foods',
      username: process.env.DB_FOODS_USERNAME || process.env.DB_DEV_FOODS_USERNAME || 'intake24',
      password: process.env.DB_FOODS_PASSWORD || process.env.DB_DEV_FOODS_PASSWORD || '',
      dialect: 'postgres' as const,
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    };

    // If using DB URL format
    const dbUrl = process.env.DB_FOODS_URL || process.env.DB_DEV_FOODS_URL;
    if (dbUrl) {
      const url = new URL(dbUrl);
      dbConfig.host = url.hostname;
      dbConfig.port = Number.parseInt(url.port || '5432', 10);
      dbConfig.database = url.pathname.slice(1);
      dbConfig.username = url.username;
      dbConfig.password = url.password;
    }

    // Initialize OpenSearch client
    const clientOptions: ClientOptions = {
      node: opensearchConfigLocal.host,
      auth: {
        username: opensearchConfigLocal.username,
        password: opensearchConfigLocal.password,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    };

    const opensearchClient = new Client(clientOptions);
    const sequelize = new Sequelize(dbConfig);

    try {
      // Test connections
      await sequelize.authenticate();
      console.log('✅ Database connection established');
      console.log(`   Database: ${dbConfig.database}`);
      console.log(`   Host: ${dbConfig.host}`);

      const health = await opensearchClient.cluster.health();
      console.log(`✅ OpenSearch cluster status: ${health.body.status}`);

      // Always use Sudachi settings for index creation
      console.log('🔎 Using Sudachi analyzers for index creation');

      // Create or recreate index
      if (recreateIndex) {
        console.log('Deleting existing index if it exists...');
        try {
          await opensearchClient.indices.delete({ index: opensearchConfigLocal.indexName });
          console.log('✅ Old index deleted');
        }
        catch (error: any) {
          if (error.statusCode !== 404)
            throw error;
          console.log('ℹ️  Index does not exist, skipping deletion');
        }
      }

      // Check if index exists
      const indexExists = await opensearchClient.indices.exists({ index: opensearchConfigLocal.indexName });

      if (!indexExists.body) {
        console.log('Creating Japanese index using Sudachi configuration...');
        const chosen = opensearchConfig.japaneseIndexSettingsSudachi;
        await opensearchClient.indices.create({
          index: opensearchConfigLocal.indexName,
          body: chosen as any,
        });
        console.log('✅ Japanese index created with Sudachi settings');
      }

      // Fetch Japanese foods from database
      console.log('Fetching Japanese foods from database...');
      const [foods] = await sequelize.query(`
        SELECT DISTINCT ON (f.code)
          f.code as food_code,
          fl.locale_id,
          fl.name,
          fl.simple_name,
          fl.alt_names,
          fl.tags,
          fa.ready_meal_option,
          fa.same_as_before_option,
          fa.reasonable_amount,
          fa.use_in_recipes
        FROM foods f
        LEFT JOIN food_locals fl ON f.code = fl.food_code
        LEFT JOIN food_attributes fa ON f.code = fa.food_code
        WHERE fl.locale_id = 'jp_JP_2024'
        ORDER BY f.code
      `);

      console.log(`Found ${foods.length} Japanese foods`);

      // Note: Additional processing like hiragana conversion and food type detection
      // is not needed since we're using the central opensearch.ts configuration
      // which handles all the necessary analyzers and mappings

      // Process foods in batches
      const processedFoods: any[] = [];

      for (const food of foods as any[]) {
        // Parse JSON fields
        let altNames = {};
        let tags: string[] = [];

        try {
          if (food.alt_names) {
            altNames = typeof food.alt_names === 'string' ? JSON.parse(food.alt_names) : food.alt_names;
          }
          if (food.tags) {
            tags = typeof food.tags === 'string' ? JSON.parse(food.tags) : food.tags;
          }
        }
        catch {
          // Ignore parsing errors
        }

        // Convert Japanese text to romaji for better cross-script search
        const nameRomaji = wanakana.toRomaji(food.name || '');

        processedFoods.push({
          food_code: food.food_code,
          locale_id: food.locale_id,
          name: food.name || '',
          name_romaji: nameRomaji, // Add romaji field for client-side transliteration
          description: food.simple_name || '',
          ready_meal_option: food.ready_meal_option || false,
          same_as_before_option: food.same_as_before_option || false,
          reasonable_amount: food.reasonable_amount || 0,
          use_in_recipes: food.use_in_recipes || 0,
          popularity: Math.random() * 100, // Random popularity for testing
          categories: [],
          tags,
          brand_names: Object.values(altNames).flat() || [],
          created_at: new Date(),
        });
      }

      // Index foods in batches
      console.log(`Indexing ${processedFoods.length} foods in batches of ${batchSize}...`);

      for (let i = 0; i < processedFoods.length; i += batchSize) {
        const batch = processedFoods.slice(i, i + batchSize);

        const body = batch.flatMap(food => [
          { index: { _index: opensearchConfigLocal.indexName, _id: food.food_code } },
          food,
        ]);

        const response = await opensearchClient.bulk({ body });

        if (response.body.errors) {
          console.error('❌ Some foods failed to index');
          const errors = response.body.items
            .filter((item: any) => item.index?.error)
            .slice(0, 5);
          console.error('Sample errors:', errors);
        }

        const progress = Math.min(i + batchSize, processedFoods.length);
        console.log(`   Indexed ${progress}/${processedFoods.length} foods`);
      }

      // Refresh index
      await opensearchClient.indices.refresh({ index: opensearchConfigLocal.indexName });
      console.log('✅ Index refreshed');

      // Test search with central configuration
      console.log('\n🎯 Testing search functionality with central config...');
      const testQueries = ['ビール', '黒ビール', 'ラーメン', '寿司'];

      for (const query of testQueries) {
        const searchResponse = await opensearchClient.search({
          index: opensearchConfigLocal.indexName,
          body: {
            query: {
              multi_match: {
                query,
                fields: [
                  'name^3',
                  'name.reading^2',
                  'name.romaji^2',
                  'brand_names^2',
                  'description',
                ],
                type: 'best_fields',
              },
            },
            size: 5,
          },
        });

        const hits = searchResponse.body.hits;
        const totalHits = typeof hits.total === 'object' ? hits.total.value : hits.total;
        console.log(`\n   Query: "${query}" - Found ${totalHits} results`);

        if (hits.hits && hits.hits.length > 0) {
          hits.hits.forEach((hit: any, index: number) => {
            console.log(`     ${index + 1}. ${hit._source.name} (${hit._source.food_code})`);
          });
        }
      }

      console.log('\n✨ Migration completed successfully!');
      console.log('\nUsing central configuration from opensearch.ts:');
      console.log('✓ Katakana-to-hiragana conversion');
      console.log('✓ Romaji support via ja_reading_romaji analyzer');
      console.log('✓ Synonym support for common food variations');
      console.log('✓ ICU folding for character normalization');
      console.log('✓ Multiple search fields with boosting');
      console.log('✓ Fuzzy matching with AUTO fuzziness');
    }
    catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    finally {
      await sequelize.close();
      await opensearchClient.close();
    }
  },
};

export default opensearchMigrate;
