import type { ClientOptions } from '@opensearch-project/opensearch';
import { Client } from '@opensearch-project/opensearch';
import config from '@intake24/api/config';
import { SearchPatternMatcher } from '@intake24/api/services/search/search-pattern-matcher';
import { normalizeForSearch, normalizeJapaneseText } from '@intake24/api/utils/japanese-normalizer';
import type { Logger } from '@intake24/common-backend';
import { JapaneseQueryClassifier } from './query-classifier';
import { SageMakerEmbeddingService } from './sagemaker-embedding-service';

;

export class OpenSearchClient {
  private client: Client;
  private readonly logger: Logger;
  private readonly indexPrefix: string;
  private readonly japaneseIndex: string;
  private readonly patternMatcher: SearchPatternMatcher;
  private readonly searchPipeline?: string;
  private readonly ingestPipeline?: string;
  private readonly neuralModelId?: string;
  private readonly neuralField: string;
  private readonly neuralK: number;
  private readonly neuralBoost?: number;
  private readonly sagemakerService?: SageMakerEmbeddingService;
  private readonly enableHybridSearch: boolean;
  private readonly embeddingField: string;
  private readonly knnK: number;
  private readonly knnBoost: number;
  private readonly useRRF: boolean;
  private readonly rrfSearchPipeline?: string;
  private neuralSearchEnabled: boolean;
  private readonly queryClassifier: JapaneseQueryClassifier;

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger.child({ service: 'OpenSearchClient' });
    this.indexPrefix = config.opensearch.indexPrefix;
    this.japaneseIndex = config.opensearch.japaneseIndex;
    this.patternMatcher = new SearchPatternMatcher();
    this.queryClassifier = new JapaneseQueryClassifier(); // Tier 3: Query classification
    this.searchPipeline = config.opensearch.japaneseSearchPipeline || undefined;
    this.ingestPipeline = config.opensearch.japaneseIngestPipeline || undefined;
    this.neuralModelId = config.opensearch.japaneseNeuralModelId || undefined;
    this.neuralField = config.opensearch.japaneseNeuralField || 'embedding';
    this.neuralK = config.opensearch.japaneseNeuralK ?? 100;
    this.neuralBoost = config.opensearch.japaneseNeuralBoost ?? 50;

    // Initialize hybrid search configuration
    this.enableHybridSearch = config.opensearch.enableHybridSearch;
    this.embeddingField = config.opensearch.embeddingField;
    this.knnK = config.opensearch.knnK;
    this.knnBoost = config.opensearch.knnBoost;
    this.useRRF = config.opensearch.useRRF ?? false;
    this.rrfSearchPipeline = config.opensearch.rrfSearchPipeline || undefined;
    this.neuralSearchEnabled = Boolean(this.neuralModelId);

    // Initialize SageMaker service if endpoint is configured
    if (config.opensearch.sagemakerRuriEndpoint) {
      this.sagemakerService = new SageMakerEmbeddingService(
        {
          endpointName: config.opensearch.sagemakerRuriEndpoint,
          region: config.opensearch.sagemakerRuriRegion,
        },
        logger,
      );
      this.logger.info('SageMaker RURI embedding service initialized');
    }

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

    if (this.neuralSearchEnabled) {
      this.logger.info(
        `Hybrid search enabled with model ${this.neuralModelId}${this.searchPipeline ? ` via search pipeline "${this.searchPipeline}"` : ''}`,
      );
    }
    else {
      this.logger.warn('Hybrid neural search not configured; falling back to lexical search only');
    }

    if (this.useRRF && this.rrfSearchPipeline) {
      this.logger.info(`RRF (Reciprocal Rank Fusion) enabled via search pipeline "${this.rrfSearchPipeline}"`);
    }

    if (this.ingestPipeline)
      this.logger.info(`Japanese ingest pipeline set to "${this.ingestPipeline}"`);
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

      const bulkParams = { body } as any;

      if (this.ingestPipeline)
        bulkParams.pipeline = this.ingestPipeline;

      const response = await this.client.bulk(bulkParams);

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
    return this.searchJapaneseFoodsInternal(query, options, true);
  }

  private async searchJapaneseFoodsInternal(query: string, options: {
    limit?: number;
    offset?: number;
    categories?: string[];
    tags?: string[];
  } = {}, allowNeural: boolean): Promise<any> {
    const { limit = 50, offset = 0, categories, tags } = options;
    const neuralActive = allowNeural && this.neuralSearchEnabled && Boolean(this.neuralModelId);

    try {
      // Generate query embedding if hybrid search is enabled
      let queryEmbedding: number[] | null = null;

      if (this.enableHybridSearch && this.sagemakerService && query) {
        // Use normalizeForSearch to get Kuromoji readings for kanji
        // This ensures 林檎, りんご, and リンゴ all produce the same embedding
        const searchNormalized = normalizeForSearch(query);
        const embeddingQuery = searchNormalized.hiragana || query.trim();
        if (embeddingQuery) {
          try {
            queryEmbedding = await this.sagemakerService.generateEmbedding(embeddingQuery);
            this.logger.debug(`Generated ${queryEmbedding.length}D embedding for query: "${embeddingQuery}" (original: "${query}")`);
          }
          catch (error) {
            this.logger.error('Failed to generate query embedding, falling back to lexical search:', error);
          }
        }
      }

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
          // Tier 3: Classify query and determine optimal kNN K value
          const queryCharacteristics = this.queryClassifier.classify(queryForSearch);
          const knnK = this.queryClassifier.getRecommendedKnnK(
            queryCharacteristics,
            this.knnK, // default K (100)
            200, // category K
          );

          this.logger.debug(
            `Query classification: ${JSON.stringify(queryCharacteristics)} → K=${knnK}`,
          );

          const neuralOptions = neuralActive && this.neuralModelId
            ? {
                field: this.neuralField,
                modelId: this.neuralModelId,
                queryText: queryForSearch,
                k: this.neuralK,
                boost: this.neuralBoost,
              }
            : null;

          // Use the configurable pattern matcher to build the complete search query
          body = this.patternMatcher.buildSearchQuery(queryForSearch, {
            size: limit,
            from: offset,
            isJapanese: true,
            queryEmbedding, // Add query embedding for hybrid search
            knnK, // Tier 3: Pass query-adaptive K value
            neuralOptions,
          });

          if (neuralActive) {
            this.logger.debug(`Using hybrid search with model "${this.neuralModelId}" for query: "${queryForSearch}"`);
          }

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

      const searchParams: Record<string, any> = {
        index: this.japaneseIndex,
        body,
      };

      // Use RRF search pipeline if enabled, otherwise use default search pipeline
      if (this.useRRF && this.rrfSearchPipeline) {
        searchParams.search_pipeline = this.rrfSearchPipeline;
      }
      else if (this.searchPipeline) {
        searchParams.search_pipeline = this.searchPipeline;
      }

      const response = await this.client.search(searchParams);

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
      if (neuralActive && this.isNeuralDimensionMismatch(error)) {
        this.logger.error(
          'Neural search failed due to embedding dimension mismatch. Disabling neural clause and retrying without it.',
          error,
        );
        this.neuralSearchEnabled = false;
        return this.searchJapaneseFoodsInternal(query, options, false);
      }

      this.logger.error('Failed to search Japanese foods:', error);
      throw error;
    }
  }

  private isNeuralDimensionMismatch(error: any): boolean {
    if (!error)
      return false;

    const messages = [
      error?.meta?.body?.error?.root_cause?.[0]?.reason,
      error?.meta?.body?.error?.reason,
      error?.body?.error?.root_cause?.[0]?.reason,
      error?.body?.error?.reason,
      error?.message,
    ];

    return messages.some(message => typeof message === 'string' && message.includes('invalid dimension'));
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
