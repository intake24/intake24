import { normalizeJapaneseText } from '@intake24/api/utils/japanese-normalizer';
import type { Logger } from '@intake24/common-backend';
import { normalizeJapaneseFoodDocument } from './japanese-food-document-normalizer';
import { OpenSearchClient } from './opensearch-client';

;

export interface JapaneseSearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  categories?: string[];
  tags?: string[];
  enablePhonetic?: boolean;
  enableSynonyms?: boolean;
  enableFuzzy?: boolean;
}

export interface JapaneseSearchResult {
  foodCode: string;
  name: string;
  description?: string;
  score: number;
  highlight?: {
    name?: string[];
    description?: string[];
  };
  categories?: string[];
  tags?: string[];
  energy?: number;
  nutrients?: {
    protein?: number;
    fat?: number;
    carbohydrate?: number;
  };
}

export class OpenSearchJapaneseService {
  private readonly client: OpenSearchClient;
  private readonly logger: Logger;
  private isInitialized: boolean = false;

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger.child({ service: 'OpenSearchJapaneseService' });
    this.client = new OpenSearchClient({ logger });
  }

  private normalizeQuery(query?: string): string {
    const original = (query ?? '').trim();
    if (!original)
      return '';

    const normalized = normalizeJapaneseText(original);

    return normalized || original;
  }

  /**
   * Initialize the service and ensure index exists
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('Service already initialized');
      return;
    }

    try {
      await this.client.checkHealth();
      await this.client.createJapaneseIndex();
      this.isInitialized = true;
      this.logger.info('OpenSearch Japanese service initialized');
    }
    catch (error) {
      this.logger.error('Failed to initialize OpenSearch Japanese service:', error);
      throw error;
    }
  }

  /**
   * Search Japanese foods with advanced features
   */
  async searchFoods(options: JapaneseSearchOptions): Promise<{
    results: JapaneseSearchResult[];
    total: number;
    took: number;
  }> {
    const {
      query,
      limit = 50,
      offset = 0,
      categories,
      tags,
      enablePhonetic: _enablePhonetic = true,
      enableSynonyms: _enableSynonyms = true,
    } = options;

    const trimmedOriginalQuery = (query ?? '').trim();
    const normalizedQuery = this.normalizeQuery(query);
    const startTime = Date.now();

    try {
      // Perform search
      const searchResult = await this.client.searchJapaneseFoods(normalizedQuery, {
        limit,
        offset,
        categories,
        tags,
      });

      // Transform results
      const results: JapaneseSearchResult[] = searchResult.hits.map((hit: any) => ({
        foodCode: hit.food_code,
        name: hit.name,
        description: hit.description,
        score: hit._score,
        highlight: hit.highlight,
        categories: hit.categories,
        tags: hit.tags,
        energy: hit.energy_kcal,
        nutrients: {
          protein: hit.protein,
          fat: hit.fat,
          carbohydrate: hit.carbohydrate,
        },
      }));

      const took = Date.now() - startTime;

      const logQuery = normalizedQuery || trimmedOriginalQuery;
      const normalizationNote = normalizedQuery !== trimmedOriginalQuery ? ` (normalized from "${query}")` : '';
      this.logger.debug(`Search for "${logQuery}"${normalizationNote} returned ${searchResult.total} results in ${took}ms`);

      return {
        results,
        total: searchResult.total,
        took,
      };
    }
    catch (error) {
      this.logger.error(`Failed to search for "${query}":`, error);
      throw error;
    }
  }

  /**
   * Get food by code
   */
  async getFoodByCode(foodCode: string): Promise<JapaneseSearchResult | null> {
    try {
      const food = await this.client.getFoodByCode(foodCode);

      if (!food)
        return null;

      return {
        foodCode: food.food_code,
        name: food.name,
        description: food.description,
        score: 1.0,
        categories: food.categories,
        tags: food.tags,
        energy: food.energy_kcal,
        nutrients: {
          protein: food.protein,
          fat: food.fat,
          carbohydrate: food.carbohydrate,
        },
      };
    }
    catch (error) {
      this.logger.error(`Failed to get food ${foodCode}:`, error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(prefix: string, limit = 10): Promise<string[]> {
    try {
      const normalizedPrefix = this.normalizeQuery(prefix);

      const searchResult = await this.client.searchJapaneseFoods(normalizedPrefix, {
        limit,
        offset: 0,
      });

      // Extract unique food names
      const suggestions = searchResult.hits
        .map((hit: any) => hit.name)
        .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index)
        .slice(0, limit);

      return suggestions;
    }
    catch (error) {
      this.logger.error(`Failed to get autocomplete for "${prefix}":`, error);
      throw error;
    }
  }

  /**
   * Get similar foods based on categories and nutrients
   */
  async getSimilarFoods(foodCode: string, limit = 10): Promise<JapaneseSearchResult[]> {
    try {
      const sourceFood = await this.client.getFoodByCode(foodCode);

      if (!sourceFood) {
        this.logger.warn(`Source food ${foodCode} not found`);
        return [];
      }

      // Search for similar foods based on categories
      const searchResult = await this.client.searchJapaneseFoods('', {
        limit,
        offset: 0,
        categories: sourceFood.categories,
      });

      // Filter out the source food and transform results
      const results: JapaneseSearchResult[] = searchResult.hits
        .filter((hit: any) => hit.food_code !== foodCode)
        .map((hit: any) => ({
          foodCode: hit.food_code,
          name: hit.name,
          description: hit.description,
          score: hit._score,
          categories: hit.categories,
          tags: hit.tags,
          energy: hit.energy_kcal,
          nutrients: {
            protein: hit.protein,
            fat: hit.fat,
            carbohydrate: hit.carbohydrate,
          },
        }));

      return results;
    }
    catch (error) {
      this.logger.error(`Failed to get similar foods for ${foodCode}:`, error);
      throw error;
    }
  }

  /**
   * Bulk index foods (for batch updates)
   */
  async bulkIndexFoods(foods: any[]): Promise<void> {
    try {
      const normalizedFoods = await Promise.all(foods.map(food => normalizeJapaneseFoodDocument(food)));
      await this.client.bulkIndexFoods(normalizedFoods);
      await this.client.refreshIndex();
      this.logger.info(`Successfully indexed ${foods.length} foods`);
    }
    catch (error) {
      this.logger.error('Failed to bulk index foods:', error);
      throw error;
    }
  }

  /**
   * Update single food
   */
  async updateFood(foodCode: string, updates: any): Promise<void> {
    try {
      const normalizedUpdates = await normalizeJapaneseFoodDocument(updates);
      await this.client.updateFood(foodCode, normalizedUpdates);
      await this.client.refreshIndex();
      this.logger.info(`Successfully updated food ${foodCode}`);
    }
    catch (error) {
      this.logger.error(`Failed to update food ${foodCode}:`, error);
      throw error;
    }
  }

  /**
   * Delete food from index
   */
  async deleteFood(foodCode: string): Promise<void> {
    try {
      await this.client.deleteFood(foodCode);
      await this.client.refreshIndex();
      this.logger.info(`Successfully deleted food ${foodCode}`);
    }
    catch (error) {
      this.logger.error(`Failed to delete food ${foodCode}:`, error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<{
    documentCount: number;
    sizeInBytes: number;
    health: string;
  }> {
    try {
      const health = await this.client.checkHealth();
      const indexName = this.client.getJapaneseIndex(); // Use getter method

      // Get index stats
      const statsResponse = await this.client.getClient().indices.stats({
        index: indexName,
      });

      const stats = statsResponse.body.indices?.[indexName];

      if (!stats) {
        throw new Error(`Index ${indexName} not found in stats`);
      }

      return {
        documentCount: stats.primaries?.docs?.count || 0,
        sizeInBytes: stats.primaries?.store?.size_in_bytes || 0,
        health: health.status,
      };
    }
    catch (error) {
      this.logger.error('Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Close the service
   */
  async close(): Promise<void> {
    await this.client.close();
    this.logger.info('OpenSearch Japanese service closed');
  }
}
