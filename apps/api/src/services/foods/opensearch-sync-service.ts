import config from '@intake24/api/config';
import type { IoC } from '@intake24/api/ioc';
import { normalizeJapaneseFoodDocument } from './japanese-food-document-normalizer';
import { OpenSearchClient } from './opensearch-client';
import { SageMakerEmbeddingService } from './sagemaker-embedding-service';

const JAPANESE_LOCALE = 'jp_JP_2024';

/**
 * Service for synchronizing individual food documents to OpenSearch
 * when they are created, updated, or deleted in the admin interface.
 */
function opensearchSyncService({ db, logger }: Pick<IoC, 'db' | 'logger'>) {
  const serviceLogger = logger.child({ service: 'OpenSearchSyncService' });
  const foodsDb = db.foods;
  const client = new OpenSearchClient({ logger });
  const embeddingField = config.opensearch.embeddingField;

  let sagemakerService: SageMakerEmbeddingService | undefined;

  // Initialize SageMaker service if endpoint is configured
  if (config.opensearch.sagemakerRuriEndpoint) {
    sagemakerService = new SageMakerEmbeddingService(
      {
        endpointName: config.opensearch.sagemakerRuriEndpoint,
        region: config.opensearch.sagemakerRuriRegion,
      },
      logger,
    );
    serviceLogger.info('SageMaker RURI service initialized for sync');
  }
  else {
    serviceLogger.warn('SageMaker RURI endpoint not configured - embeddings will not be generated');
  }

  /**
   * Check if the given locale uses OpenSearch for search
   */
  function isJapaneseLocale(localeId: string): boolean {
    return localeId === JAPANESE_LOCALE;
  }

  /**
   * Fetch food data from the database
   */
  async function fetchFoodData(foodCode: string, localeId: string): Promise<any | null> {
    const [results] = await foodsDb.query(`
      SELECT
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
      WHERE fl.locale_id = :localeId AND f.code = :foodCode
      LIMIT 1
    `, {
      replacements: { localeId, foodCode },
    });

    if (!results || results.length === 0) {
      return null;
    }

    return results[0];
  }

  /**
   * Build the OpenSearch document from food data
   */
  async function buildDocument(food: any): Promise<any> {
    // Parse JSON fields
    let altNames: Record<string, any> = {};
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

    // Extract brand names from alt_names
    const brandNames = Array.from(
      new Set(
        Object.values(altNames)
          .flat()
          .map((value: any) => typeof value === 'string' ? value.trim() : '')
          .filter(Boolean),
      ),
    );

    // Build synonyms from alt_names and simple_name
    const manualSynonyms = new Set<string>();
    if (brandNames.length > 0)
      brandNames.forEach(value => manualSynonyms.add(value));
    if (food.simple_name)
      manualSynonyms.add(food.simple_name);

    // Build base document
    const baseDoc: any = {
      food_code: food.food_code,
      locale_id: food.locale_id,
      name: food.name || '',
      description: food.simple_name || '',
      ready_meal_option: food.ready_meal_option || false,
      same_as_before_option: food.same_as_before_option || false,
      reasonable_amount: food.reasonable_amount || 0,
      use_in_recipes: food.use_in_recipes || 0,
      popularity: 0,
      categories: [],
      tags,
      brand_names: brandNames,
      updated_at: new Date(),
    };

    if (manualSynonyms.size > 0)
      baseDoc.name_synonyms = Array.from(manualSynonyms);

    // Normalize the document (adds hiragana, katakana, romaji, variants)
    const normalizedDoc = await normalizeJapaneseFoodDocument(baseDoc);

    return normalizedDoc;
  }

  /**
   * Index a single food document (upsert behavior)
   */
  async function indexFood(document: any): Promise<void> {
    const osClient = client.getClient();
    const indexName = client.getJapaneseIndex();

    await osClient.index({
      index: indexName,
      id: document.food_code,
      body: document,
      refresh: true, // Make the document immediately searchable
    });
  }

  /**
   * Sync a single food document to OpenSearch after create/update
   */
  async function syncFood(localeId: string, foodCode: string): Promise<void> {
    if (!isJapaneseLocale(localeId)) {
      serviceLogger.debug(`Skipping OpenSearch sync for non-Japanese locale: ${localeId}`);
      return;
    }

    try {
      // Fetch the complete food data from database
      const foodData = await fetchFoodData(foodCode, localeId);

      if (!foodData) {
        serviceLogger.warn(`Food ${foodCode} not found in locale ${localeId}, skipping sync`);
        return;
      }

      // Build the document structure
      const document = await buildDocument(foodData);

      // Generate embedding for the food name
      if (sagemakerService && document.name) {
        try {
          const embedding = await sagemakerService.generateEmbedding(document.name);
          (document as any)[embeddingField] = embedding;
          serviceLogger.debug(`Generated ${embedding.length}D embedding for food: ${foodCode}`);
        }
        catch (error) {
          serviceLogger.error(`Failed to generate embedding for food ${foodCode}:`, error);
          // Continue without embedding - lexical search will still work
        }
      }

      // Index the document (upsert behavior)
      await indexFood(document);

      serviceLogger.info(`Successfully synced food ${foodCode} to OpenSearch`);
    }
    catch (error) {
      serviceLogger.error(`Failed to sync food ${foodCode} to OpenSearch:`, error);
      // Don't throw - sync failures shouldn't block the main operation
    }
  }

  /**
   * Delete a food document from OpenSearch
   */
  async function deleteFood(localeId: string, foodCode: string): Promise<void> {
    if (!isJapaneseLocale(localeId)) {
      serviceLogger.debug(`Skipping OpenSearch delete for non-Japanese locale: ${localeId}`);
      return;
    }

    try {
      await client.deleteFood(foodCode);
      serviceLogger.info(`Successfully deleted food ${foodCode} from OpenSearch`);
    }
    catch (error) {
      serviceLogger.error(`Failed to delete food ${foodCode} from OpenSearch:`, error);
      // Don't throw - sync failures shouldn't block the main operation
    }
  }

  /**
   * Close the client connection
   */
  async function close(): Promise<void> {
    await client.close();
    serviceLogger.info('OpenSearch sync service closed');
  }

  return {
    syncFood,
    deleteFood,
    close,
  };
}

export default opensearchSyncService;

export type OpenSearchSyncService = ReturnType<typeof opensearchSyncService>;
