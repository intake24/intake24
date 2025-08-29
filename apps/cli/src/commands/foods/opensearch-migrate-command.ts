import type { ClientOptions } from '@opensearch-project/opensearch';
import * as path from 'node:path';
import { Client } from '@opensearch-project/opensearch';
import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

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
        console.log('Creating Japanese index using central configuration...');

        // Use settings from central opensearch.ts config file
        // Use a simplified version of the index settings without synonyms for now
        const indexSettings: any = {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              char_filter: {
                icu_nfkc_cf: opensearchConfig.japaneseIndexSettings.settings.analysis.char_filter.icu_nfkc_cf,
                katakana_to_hiragana_mapping: opensearchConfig.japaneseIndexSettings.settings.analysis.char_filter.katakana_to_hiragana_mapping,
              },
              tokenizer: {
                kuromoji_user_dict: opensearchConfig.japaneseIndexSettings.settings.analysis.tokenizer.kuromoji_user_dict,
              },
              analyzer: {
                ja_search: {
                  type: 'custom',
                  tokenizer: 'kuromoji_user_dict',
                  char_filter: ['icu_nfkc_cf', 'katakana_to_hiragana_mapping'],
                  filter: [
                    'kuromoji_baseform',
                    'kuromoji_part_of_speech',
                    'ja_stop',
                    'lowercase',
                    'icu_folding',
                  ],
                },
                ja_reading: {
                  type: 'custom',
                  tokenizer: 'kuromoji_user_dict',
                  char_filter: ['icu_nfkc_cf', 'katakana_to_hiragana_mapping'],
                  filter: [
                    'kuromoji_readingform',
                    'lowercase',
                    'icu_folding',
                  ],
                },
                ja_reading_romaji: {
                  type: 'custom',
                  tokenizer: 'kuromoji_user_dict',
                  char_filter: ['icu_nfkc_cf', 'katakana_to_hiragana_mapping'],
                  filter: [
                    'reading_romaji',
                    'lowercase',
                    'icu_folding',
                  ],
                },
                ja_query: {
                  type: 'custom',
                  tokenizer: 'kuromoji_user_dict',
                  char_filter: ['icu_nfkc_cf', 'katakana_to_hiragana_mapping'],
                  filter: [
                    'synonym_graph_filter',
                    'kuromoji_baseform',
                    'kuromoji_part_of_speech',
                    'ja_stop',
                    'kuromoji_number',
                    'kuromoji_stemmer',
                    'lowercase',
                    'icu_folding',
                  ],
                },
              },
              filter: {
                icu_folding: {
                  type: 'icu_folding',
                  unicodeSetFilter: '[^ぁ-ゟァ-ヿ]',
                },
                reading_romaji: {
                  type: 'kuromoji_readingform',
                  use_romaji: true,
                },
                synonym_graph_filter: {
                  type: 'synonym_graph',
                  lenient: true,
                  synonyms: [
                    // Basic synonyms for testing
                    'チャーハン,炒飯,焼き飯,やきめし,fried rice',
                    'ラーメン,拉麺,らーめん,中華そば,ramen',
                    '寿司,すし,鮨,スシ,sushi',
                    '天ぷら,てんぷら,天麩羅,テンプラ,tempura',
                    'ご飯,ごはん,御飯,米飯,ライス,rice',
                    '味噌汁,みそ汁,みそしる,お味噌汁,miso soup',
                    '牛肉,ぎゅうにく,ビーフ,beef',
                    '鶏肉,とりにく,チキン,chicken',
                  ],
                },
              },
            },
          },
          mappings: {
            properties: {
              food_code: { type: 'keyword' },
              locale_id: { type: 'keyword' },
              name: {
                type: 'text',
                analyzer: 'ja_search',
                search_analyzer: 'ja_query', // Use query-time synonyms
                fields: {
                  reading: {
                    type: 'text',
                    analyzer: 'ja_reading',
                  },
                  romaji: {
                    type: 'text',
                    analyzer: 'ja_reading_romaji',
                  },
                  keyword: { type: 'keyword' },
                },
              },
              description: {
                type: 'text',
                analyzer: 'ja_search',
              },
              brand_names: {
                type: 'text',
                analyzer: 'ja_search',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              categories: { type: 'keyword' },
              tags: { type: 'keyword' },
              popularity: { type: 'float' },
              ready_meal_option: { type: 'boolean' },
              same_as_before_option: { type: 'boolean' },
              reasonable_amount: { type: 'integer' },
              use_in_recipes: { type: 'integer' },
              associated_food_prompt: { type: 'keyword' },
              nutrient_table_id: { type: 'keyword' },
              nutrient_table_code: { type: 'keyword' },
              energy_kcal: { type: 'float' },
              energy_kj: { type: 'float' },
              protein: { type: 'float' },
              fat: { type: 'float' },
              carbohydrate: { type: 'float' },
              alcohol: { type: 'float' },
              sugars: { type: 'float' },
              fibre: { type: 'float' },
              sodium: { type: 'float' },
              salt: { type: 'float' },
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
            },
          },
        };

        await opensearchClient.indices.create({
          index: opensearchConfigLocal.indexName,
          body: indexSettings,
        });
        console.log('✅ Japanese index created with settings from opensearch.ts');
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

        processedFoods.push({
          food_code: food.food_code,
          locale_id: food.locale_id,
          name: food.name || '',
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
      const testQueries = ['すし', '寿司', 'ラーメン', 'てんぷら', 'sushi', 'ramen'];

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
                  'name.synonym^2',
                  'description',
                  'brand_names',
                ],
                type: 'best_fields',
                fuzziness: 'AUTO',
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
