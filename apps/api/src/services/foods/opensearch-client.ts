import type { ClientOptions } from '@opensearch-project/opensearch';
import { Client } from '@opensearch-project/opensearch';
import config from '@intake24/api/config';
import { SearchPatternMatcher } from '@intake24/api/services/search/search-pattern-matcher';
import { normalizeJapaneseText } from '@intake24/api/utils/japanese-normalizer';
import type { Logger } from '@intake24/common-backend';

export class OpenSearchClient {
  private client: Client;
  private readonly logger: Logger;
  private readonly indexPrefix: string;
  private readonly japaneseIndex: string;
  private readonly patternMatcher: SearchPatternMatcher;

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger.child({ service: 'OpenSearchClient' });
    this.indexPrefix = config.opensearch.indexPrefix;
    this.japaneseIndex = config.opensearch.japaneseIndex;
    this.patternMatcher = new SearchPatternMatcher();

    const clientOptions: ClientOptions = {
      node: config.opensearch.host,
      auth: {
        username: config.opensearch.username,
        password: config.opensearch.password,
      },
      ssl: {
        rejectUnauthorized: false, // For development; use true in production with proper certificates
      },
    };

    this.client = new Client(clientOptions);
    this.logger.info(`OpenSearch client initialized for ${config.opensearch.host}`);
  }

  /**
   * Get the OpenSearch client instance
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get the Japanese index name
   */
  getJapaneseIndex(): string {
    return this.japaneseIndex;
  }

  /**
   * Check cluster health
   */
  async checkHealth(): Promise<any> {
    try {
      const health = await this.client.cluster.health();
      this.logger.info('OpenSearch cluster health:', health.body);
      return health.body;
    }
    catch (error) {
      this.logger.error('Failed to check OpenSearch cluster health:', error);
      throw error;
    }
  }

  /**
   * Create Japanese food index with proper analyzers
   */
  async createJapaneseIndex(): Promise<void> {
    try {
      // Check if index exists
      const exists = await this.client.indices.exists({
        index: this.japaneseIndex,
      });

      if (exists.body) {
        this.logger.info(`Index ${this.japaneseIndex} already exists`);
        return;
      }

      // Create index with Japanese analyzers (always use Sudachi settings)
      const response = await this.client.indices.create({
        index: this.japaneseIndex,
        body: config.opensearch.japaneseIndexSettingsSudachi as any, // Type assertion for complex mapping
      });

      this.logger.info(`Created Japanese index ${this.japaneseIndex}:`, response.body);
    }
    catch (error) {
      this.logger.error(`Failed to create Japanese index ${this.japaneseIndex}:`, error);
      throw error;
    }
  }

  /**
   * Delete Japanese food index
   */
  async deleteJapaneseIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({
        index: this.japaneseIndex,
      });

      if (!exists.body) {
        this.logger.info(`Index ${this.japaneseIndex} does not exist`);
        return;
      }

      const response = await this.client.indices.delete({
        index: this.japaneseIndex,
      });

      this.logger.info(`Deleted index ${this.japaneseIndex}:`, response.body);
    }
    catch (error) {
      this.logger.error(`Failed to delete index ${this.japaneseIndex}:`, error);
      throw error;
    }
  }

  /**
   * Bulk index foods
   */
  async bulkIndexFoods(foods: any[]): Promise<void> {
    if (foods.length === 0)
      return;

    try {
      const body = foods.flatMap(food => [
        { index: { _index: this.japaneseIndex, _id: food.food_code } },
        food,
      ]);

      const response = await this.client.bulk({ body });

      if (response.body.errors) {
        const errors = response.body.items
          .filter((item: any) => item.index?.error)
          .map((item: any) => item.index.error);
        this.logger.error('Bulk indexing errors:', errors);
        throw new Error('Failed to index some foods');
      }

      this.logger.info(`Successfully indexed ${foods.length} foods`);
    }
    catch (error) {
      this.logger.error('Failed to bulk index foods:', error);
      throw error;
    }
  }

  /**
   * Search Japanese foods
   */
  async searchJapaneseFoods(query: string, options: {
    limit?: number;
    offset?: number;
    categories?: string[];
    tags?: string[];
  } = {}): Promise<any> {
    const { limit = 50, offset = 0, categories, tags } = options;

    try {
      let body: any;
      const filterClauses: any[] = [];

      if (categories && categories.length > 0)
        filterClauses.push({ terms: { categories } });

      if (tags && tags.length > 0)
        filterClauses.push({ terms: { tags } });

      if (query) {
        const normalizedQuery = normalizeJapaneseText(query);
        const trimmedOriginal = query.trim();
        const queryForSearch = normalizedQuery || trimmedOriginal;

        if (queryForSearch) {
          // Use the configurable pattern matcher to build the complete search query
          body = this.patternMatcher.buildSearchQuery(queryForSearch, {
            size: limit,
            from: offset,
            isJapanese: true,
          });

          if (filterClauses.length > 0) {
            const originalQuery = body.query.function_score.query;
            body.query.function_score.query = {
              bool: {
                must: [originalQuery],
                filter: filterClauses,
              },
            };
          }
        }
        else {
          body = {
            from: offset,
            size: limit,
            query: {
              bool: {
                must: { match_all: {} },
                filter: filterClauses.length > 0 ? filterClauses : undefined,
              },
            },
          };
        }
      }
      else {
        body = {
          from: offset,
          size: limit,
          query: {
            bool: {
              must: { match_all: {} },
              filter: filterClauses.length > 0 ? filterClauses : undefined,
            },
          },
        };
      }

      const response = await this.client.search({
        index: this.japaneseIndex,
        body,
      });

      return {
        total: typeof response.body.hits.total === 'object'
          ? response.body.hits.total.value
          : response.body.hits.total || 0,
        hits: response.body.hits.hits.map((hit: any) => ({
          ...hit._source,
          _id: hit._id,
          _score: hit._score,
          highlight: hit.highlight,
        })),
      };
    }
    catch (error) {
      this.logger.error('Failed to search Japanese foods:', error);
      throw error;
    }
  }

  /**
   * Get food by code
   */
  async getFoodByCode(foodCode: string): Promise<any> {
    try {
      const response = await this.client.get({
        index: this.japaneseIndex,
        id: foodCode,
      });

      return response.body._source;
    }
    catch (error: any) {
      if (error.statusCode === 404)
        return null;

      this.logger.error(`Failed to get food ${foodCode}:`, error);
      throw error;
    }
  }

  /**
   * Update food document
   */
  async updateFood(foodCode: string, updates: any): Promise<void> {
    try {
      await this.client.update({
        index: this.japaneseIndex,
        id: foodCode,
        body: {
          doc: updates,
        },
      });

      this.logger.info(`Updated food ${foodCode}`);
    }
    catch (error) {
      this.logger.error(`Failed to update food ${foodCode}:`, error);
      throw error;
    }
  }

  /**
   * Delete food document
   */
  async deleteFood(foodCode: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.japaneseIndex,
        id: foodCode,
      });

      this.logger.info(`Deleted food ${foodCode}`);
    }
    catch (error: any) {
      if (error.statusCode === 404) {
        this.logger.warn(`Food ${foodCode} not found for deletion`);
        return;
      }

      this.logger.error(`Failed to delete food ${foodCode}:`, error);
      throw error;
    }
  }

  /**
   * Get index mapping
   */
  async getIndexMapping(): Promise<any> {
    try {
      const response = await this.client.indices.getMapping({
        index: this.japaneseIndex,
      });

      return response.body[this.japaneseIndex];
    }
    catch (error) {
      this.logger.error('Failed to get index mapping:', error);
      throw error;
    }
  }

  /**
   * Get index settings
   */
  async getIndexSettings(): Promise<any> {
    try {
      const response = await this.client.indices.getSettings({
        index: this.japaneseIndex,
      });

      return response.body[this.japaneseIndex];
    }
    catch (error) {
      this.logger.error('Failed to get index settings:', error);
      throw error;
    }
  }

  /**
   * Refresh index to make documents searchable immediately
   */
  async refreshIndex(): Promise<void> {
    try {
      await this.client.indices.refresh({
        index: this.japaneseIndex,
      });

      this.logger.info(`Refreshed index ${this.japaneseIndex}`);
    }
    catch (error) {
      this.logger.error('Failed to refresh index:', error);
      throw error;
    }
  }

  /**
   * Close the client connection
   */
  async close(): Promise<void> {
    await this.client.close();
    this.logger.info('OpenSearch client connection closed');
  }
}
