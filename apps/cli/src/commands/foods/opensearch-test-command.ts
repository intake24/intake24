import type { ClientOptions } from '@opensearch-project/opensearch';
import * as path from 'node:path';
import { Client } from '@opensearch-project/opensearch';
import * as dotenv from 'dotenv';

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

export interface OpenSearchTestArguments {
  query: string;
  locale?: string;
  size?: number;
  verbose?: boolean;
}

const opensearchTest = {
  handler: async (args: OpenSearchTestArguments): Promise<void> => {
    const { query, locale = 'jp_JP_2024', size = 10, verbose = false } = args;

    console.log(`\n🔍 Testing OpenSearch for locale: ${locale}`);
    console.log(`   Query: "${query}"`);
    console.log(`   Results limit: ${size}`);
    console.log(`   Verbose: ${verbose}\n`);

    // OpenSearch configuration
    const opensearchConfig = {
      host: process.env.OPENSEARCH_HOST || 'https://search-intake24-food-search-szuol46zbsxedzttt3cme3m6my.ap-southeast-2.es.amazonaws.com',
      username: process.env.OPENSEARCH_USERNAME,
      password: process.env.OPENSEARCH_PASSWORD,
      indexName: process.env.OPENSEARCH_JAPANESE_INDEX || 'intake24_foods_ja',
    };

    if (!opensearchConfig.username || !opensearchConfig.password) {
      console.error('❌ OpenSearch credentials not found in environment variables');
      console.log('Please set OPENSEARCH_USERNAME and OPENSEARCH_PASSWORD in your .env file');
      process.exit(1);
    }

    // Initialize OpenSearch client
    const clientOptions: ClientOptions = {
      node: opensearchConfig.host,
      auth: {
        username: opensearchConfig.username,
        password: opensearchConfig.password,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    };

    const opensearchClient = new Client(clientOptions);

    try {
      // Check OpenSearch cluster health
      const health = await opensearchClient.cluster.health();
      console.log(`✅ OpenSearch cluster status: ${health.body.status}`);

      // Perform search
      console.log('\n📋 Search Results:');
      console.log('─'.repeat(60));

      const searchResponse = await opensearchClient.search({
        index: opensearchConfig.indexName,
        body: {
          query: {
            multi_match: {
              query,
              fields: ['name^3', 'name.reading^2', 'description', 'brand_names'],
              type: 'best_fields',
              fuzziness: 'AUTO',
              prefix_length: 1,
            },
          },
          highlight: {
            fields: {
              name: {},
              description: {},
            },
            pre_tags: ['**'],
            post_tags: ['**'],
          },
          size,
          _source: ['food_code', 'name', 'description', 'tags', 'popularity', 'categories'],
        },
      });

      const hits = searchResponse.body.hits;
      const total = typeof hits.total === 'object' ? hits.total.value : hits.total;

      console.log(`\nFound ${total} total results (showing ${Math.min(size, total || 0)}):\n`);

      if (hits.hits && hits.hits.length > 0) {
        hits.hits.forEach((hit: any, index: number) => {
          console.log(`${index + 1}. [Score: ${hit._score.toFixed(2)}] ${hit._source.name}`);
          console.log(`   Code: ${hit._source.food_code}`);

          if (hit._source.description) {
            console.log(`   Description: ${hit._source.description}`);
          }

          if (hit.highlight?.name) {
            console.log(`   Match: ${hit.highlight.name[0]}`);
          }

          if (verbose) {
            if (hit._source.popularity) {
              console.log(`   Popularity: ${hit._source.popularity.toFixed(1)}`);
            }
            if (hit._source.tags && hit._source.tags.length > 0) {
              console.log(`   Tags: ${hit._source.tags.join(', ')}`);
            }
            if (hit._source.categories && hit._source.categories.length > 0) {
              console.log(`   Categories: ${hit._source.categories.join(', ')}`);
            }
          }

          console.log();
        });
      }
      else {
        console.log('No results found.');
      }

      // Analyze query if verbose
      if (verbose) {
        console.log('\n🔬 Query Analysis:');
        console.log('─'.repeat(60));

        const analyzeResponse = await opensearchClient.indices.analyze({
          index: opensearchConfig.indexName,
          body: {
            analyzer: 'ja_search',
            text: query,
          },
        });

        console.log('Tokens (ja_search analyzer):');
        if (analyzeResponse.body.tokens) {
          analyzeResponse.body.tokens.forEach((token: any) => {
            console.log(`  - "${token.token}" (position: ${token.position}, type: ${token.type})`);
          });
        }

        const readingResponse = await opensearchClient.indices.analyze({
          index: opensearchConfig.indexName,
          body: {
            analyzer: 'ja_reading',
            text: query,
          },
        });

        console.log('\nReading tokens (ja_reading analyzer):');
        if (readingResponse.body.tokens) {
          readingResponse.body.tokens.forEach((token: any) => {
            console.log(`  - "${token.token}" (position: ${token.position}, type: ${token.type})`);
          });
        }
      }

      // Show index statistics if verbose
      if (verbose) {
        console.log('\n📊 Index Statistics:');
        console.log('─'.repeat(60));

        const stats = await opensearchClient.indices.stats({ index: opensearchConfig.indexName });
        if (stats.body.indices) {
          const indexStats = stats.body.indices[opensearchConfig.indexName];
          if (indexStats?.primaries) {
            if (indexStats.primaries.docs) {
              console.log(`Total documents: ${indexStats.primaries.docs.count}`);
            }
            if (indexStats.primaries.store) {
              console.log(`Index size: ${(indexStats.primaries.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB`);
            }
            if (indexStats.primaries.segments) {
              console.log(`Number of segments: ${indexStats.primaries.segments.count}`);
            }
          }
        }
      }

      console.log('\n✨ Search test completed successfully!');
    }
    catch (error) {
      console.error('❌ Search test failed:', error);
      process.exit(1);
    }
    finally {
      await opensearchClient.close();
    }
  },
};

export default opensearchTest;
