/* eslint-disable antfu/no-top-level-await, perfectionist/sort-imports */
import '@intake24/api/bootstrap';

import type InterpretedPhrase from '../interpreted-phrase';
import { parentPort as parentPortNullable, workerData } from 'node:worker_threads';
import LanguageBackends from '@intake24/api/food-index/language-backends';
import type { PhraseMatchResult, PhraseWithKey } from '@intake24/api/food-index/phrase-index';
import { PhraseIndex } from '@intake24/api/food-index/phrase-index';
import { rankCategoryResults, rankFoodResults } from '@intake24/api/food-index/ranking/ranking';
import type { SearchRequest } from '@intake24/api/food-index/search-query';
import type { LocaleBuildResult, WorkerRequest } from '@intake24/api/food-index/worker-protocol';
import { ParentCategoryIndex } from '@intake24/api/food-index/workers/parent-category-index';
import { planRebuild } from '@intake24/api/food-index/workers/rebuild-plan';
import { NotFoundError } from '@intake24/api/http/errors';
import type { FoodHeader, FoodSearchResponse } from '@intake24/common/types/http';
import { logger as servicesLogger } from '@intake24/common-backend';
import { Database, FoodBuilder, FoodsLocale, SynonymSet } from '@intake24/db';
import type { CategoryData } from './food-data';
import { fetchCategories, fetchFoodBuilders, fetchFoods } from './food-data';

if (parentPortNullable === null)
  throw new Error('This file can only be run as a worker thread');

const parentPort = parentPortNullable;

const MAX_PHRASE_COMBINATIONS = 1000;

const databases = new Database({
  environment: workerData.env,
  databaseConfig: workerData.dbConnectionInfo,
  logger: servicesLogger,
});

interface LocalFoodIndex {
  foodIndex: PhraseIndex<string>;
  categoryIndex: PhraseIndex<string>;
  parentCategoryIndex: ParentCategoryIndex;
}

interface FoodIndex {
  [key: string]: LocalFoodIndex;
}

const index: FoodIndex = {};

const logger = servicesLogger.child({ service: 'Food index' });

function parseSynonymSet(value: string): Set<string> {
  return new Set<string>(value.trim().split(/\s+/));
}

async function getSynonymSets(localeId: string): Promise<Set<string>[]> {
  const synSets = await SynonymSet.findAll({ attributes: ['synonyms'], where: { localeId } });
  return synSets.map(s => parseSynonymSet(s.synonyms));
}

async function getFoodBuildersSynonymSets(localeId: string): Promise<Set<string>[]> {
  const foodBuilders = await FoodBuilder.findAll({
    attributes: ['triggerWord'],
    where: { localeId },
    include: [{ association: 'synonymSet', attributes: ['synonyms'] }],
  });
  return foodBuilders.map(entry => parseSynonymSet(`${entry.triggerWord} ${entry.synonymSet?.synonyms ?? ''}`));
}

async function getLanguageBackendId(localeId: string): Promise<string> {
  const row = await FoodsLocale.findOne({
    attributes: ['foodIndexLanguageBackendId'],
    where: { id: localeId },
  });

  if (!row)
    throw new NotFoundError(`Locale "${localeId}" not found`);

  return row.foodIndexLanguageBackendId;
}

// Building index for each locale
async function buildIndexForLocale(localeId: string): Promise<LocalFoodIndex> {
  const [
    foods,
    allCategories,
    synonymSets,
    foodBuildersSynonymSet,
    languageBackendId,
    foodBuilders,
  ] = await Promise.all([
    fetchFoods(localeId),
    fetchCategories(localeId),
    getSynonymSets(localeId),
    getFoodBuildersSynonymSets(localeId),
    getLanguageBackendId(localeId),
    fetchFoodBuilders(localeId),
  ]);

  const languageBackend = LanguageBackends[languageBackendId];

  if (!languageBackend) {
    throw new NotFoundError(
      `Language backend "${languageBackendId}" for locale "${localeId}" not found`,
    );
  }

  const parentCategoryIndex = new ParentCategoryIndex(foods, allCategories, logger);

  const categories = allCategories.filter(category => parentCategoryIndex.nonEmptyCategories.has(category.code));

  const foodDescriptions = new Array<PhraseWithKey<string>>();

  for (const food of foods) {
    if (!food.name)
      continue;

    foodDescriptions.push({ phrase: food.name, key: food.code, id: food.id });

    const altNames = food.altNames[languageBackend.languageCode];

    if (altNames !== undefined) {
      for (const name of altNames) foodDescriptions.push({ phrase: name, key: food.code, id: food.id });
    }
  }

  const categoryDescriptions = new Array<PhraseWithKey<string>>();

  for (const category of categories) {
    if (!category.name || category.hidden)
      continue;

    categoryDescriptions.push({ phrase: category.name, key: category.code, id: category.id });
  }

  const foodIndex = new PhraseIndex<string>(
    foodDescriptions,
    languageBackend,
    synonymSets,
    foodBuildersSynonymSet,
    foodBuilders,
  );

  const categoryIndex = new PhraseIndex<string>(
    categoryDescriptions,
    languageBackend,
    synonymSets,
  );

  return {
    foodIndex,
    categoryIndex,
    parentCategoryIndex,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

async function buildIndexesForLocales(locales: Iterable<string>): Promise<LocaleBuildResult[]> {
  const results = new Array<LocaleBuildResult>();

  for (const localeId of locales) {
    try {
      const rebuiltIndex = await buildIndexForLocale(localeId);
      index[localeId] = rebuiltIndex;
      results.push({ localeId, success: true });
    }
    catch (error) {
      results.push({ localeId, success: false, error: toError(error) });
    }
  }

  return results;
}

async function getEnabledLocales(): Promise<string[]> {
  const locales = await FoodsLocale.findAll({
    attributes: ['id'],
    where: { foodIndexEnabled: true },
  });

  return locales.map(({ id }) => id);
}

/**
 * Function for checking interpreted query against the Special Foods Set and returning the result
 * @param interpretedQuery {InterpretedPhrase} - interpreted query
 * @param query {SearchRequest} - search query
 * @returns FoodHeader[] - array of FoodHeaders of special foods
 */

async function matchFoodBuilders(
  interpretedQuery: InterpretedPhrase,
  query: SearchRequest,
): Promise<FoodHeader[]> {
  const localeIndex = index[query.parameters.localeId];
  if (!localeIndex)
    throw new NotFoundError(`Locale ${query.parameters.localeId} does not exist or is not enabled`);

  const foodBuildersTuples = localeIndex.foodIndex.foodBuildersList;
  const foodBuilderHeaders: FoodHeader[] = [];

  // TODO: Optimise the performance of this function
  for (const foodBuilder of foodBuildersTuples) {
    interpretedQuery.words.forEach((word) => {
      const asTypedExactMatch = foodBuilder[1].synonyms.has(word.asTyped);
      word.interpretations.forEach((interpretation) => {
        if (foodBuilder[1].synonyms.has(interpretation.dictionaryWord) || asTypedExactMatch) {
          return foodBuilderHeaders.push({
            id: foodBuilder[1].id,
            code: foodBuilder[1].code,
            name: foodBuilder[1].description,
          });
        }
      });
    });
  }

  const foodBuilderHeadersFiltered: FoodHeader[] = foodBuilderHeaders.reduce((acc, current) => {
    const temp = acc.find(item => item.code === current.code);
    if (!temp)
      return [...acc, ...[current]];
    else
      return acc;
  }, [] as FoodHeader[]);
  return foodBuilderHeadersFiltered;
}

function getRelevantCategories(index: LocalFoodIndex, foodResults: PhraseMatchResult<string>[], categoryResults: PhraseMatchResult<string>[], transitiveLimit: number): PhraseMatchResult<string>[] {
  const foodCodes = foodResults.map(matchResult => matchResult.key);
  const relevantCategories: Map<string, CategoryData> = new Map<string, CategoryData>();

  for (const foodCode of foodCodes) {
    const transitiveParentCategories = index.parentCategoryIndex.getFoodTransitiveParentCategories(foodCode, transitiveLimit);
    for (const [categoryCode, data] of transitiveParentCategories) {
      // Skip categories that have been matched by the search algorithm to prevent duplicates (for example, "Tap water"/"Water")
      if (!categoryResults.some(result => result.key === categoryCode)) {
        if (!relevantCategories.has(categoryCode))
          relevantCategories.set(categoryCode, data);
      }
    }
  }

  return Array.from(relevantCategories.entries(), ([categoryCode, categoryData]) => ({
    id: categoryData.id,
    key: categoryCode,
    phrase: categoryData.name,
    quality: 0,
  }));
}

async function queryIndex(query: SearchRequest): Promise<FoodSearchResponse> {
  const localeIndex = index[query.parameters.localeId];
  if (!localeIndex)
    throw new NotFoundError(`Locale ${query.parameters.localeId} does not exist or is not enabled`);

  const spellingCorrectionParameters = {
    spellingCorrectionPreference: query.parameters.spellingCorrectionPreference,
    enableEditDistance: query.parameters.enableEditDistance,
    minWordLength1: query.parameters.minWordLength1,
    minWordLength2: query.parameters.minWordLength2,
    enablePhonetic: query.parameters.enablePhonetic,
    minWordLengthPhonetic: query.parameters.minWordLengthPhonetic,
  };

  const matchQualityParameters = {
    firstWordCost: query.parameters.firstWordCost,
    wordOrderCost: query.parameters.wordOrderCost,
    wordDistanceCost: query.parameters.wordDistanceCost,
    unmatchedWordCost: query.parameters.unmatchedWordCost,
  };

  const foodInterpretation = localeIndex.foodIndex.interpretPhrase(
    query.parameters.description,
    spellingCorrectionParameters,
    'foods',
  );
  const foodInterpretedBuilders = localeIndex.foodIndex.interpretPhrase(
    query.parameters.description,
    spellingCorrectionParameters,
    'recipes',
  );
  let foodBuilderHeaders: FoodHeader[] = [];
  if (foodInterpretedBuilders.words.length > 0)
    foodBuilderHeaders = await matchFoodBuilders(foodInterpretedBuilders, query);

  const foodResults = localeIndex.foodIndex.findMatches(foodInterpretation, MAX_PHRASE_COMBINATIONS, matchQualityParameters, (foodCode: string) => {
    const acceptHidden = query.parameters.includeHidden || !localeIndex.parentCategoryIndex.isFoodHidden(foodCode);
    const acceptCategory
      = query.parameters.limitToCategory === undefined
        || localeIndex.parentCategoryIndex.isFoodInCategory(foodCode, query.parameters.limitToCategory);

    return acceptHidden && acceptCategory;
  });

  const categoryInterpretation = localeIndex.categoryIndex.interpretPhrase(
    query.parameters.description,
    spellingCorrectionParameters,
    'categories',
  );

  const categoryResults = localeIndex.categoryIndex.findMatches(categoryInterpretation, MAX_PHRASE_COMBINATIONS, matchQualityParameters, (categoryCode: string) => {
    return (query.parameters.limitToCategory === undefined || localeIndex.parentCategoryIndex.isSubCategory(categoryCode, query.parameters.limitToCategory));
  });

  if (query.parameters.enableRelevantCategories)
    categoryResults.push(...getRelevantCategories(localeIndex, foodResults, categoryResults, query.parameters.relevantCategoryDepth));

  const foods = await rankFoodResults(
    foodResults,
    query.parameters.localeId,
    query.parameters.sortingAlgorithm,
    query.parameters.matchScoreWeight / 100.0,
    logger,
    foodBuilderHeaders,
  );

  const categories = rankCategoryResults(categoryResults);

  return {
    foods: foods.slice(0, query.parameters.limit),
    categories: categories.slice(0, query.parameters.limit),
  };
}

const cleanUpIndexBuilder = async () => databases.close();

async function initialiseIndex() {
  const enabledLocales = await getEnabledLocales();

  logger.debug(`Enabled locales: ${JSON.stringify(enabledLocales)}`);
  parentPort.postMessage({ type: 'initialising', locales: enabledLocales });

  // Ideally this needs to be done on parallel threads, not sure if worth it in node.js
  const results = await buildIndexesForLocales(enabledLocales);
  parentPort.postMessage({ type: 'ready', results });
}

parentPort.on('message', async (msg: WorkerRequest) => {
  switch (msg.type) {
    case 'exit':
      await cleanUpIndexBuilder();
      logger.debug('Closing index builder');
      process.exit(0);
      return; // Linter doesn't know process.exit() terminates the branch

    case 'rebuild': {
      try {
        // Refreshed on every rebuild so that locales enabled or disabled since the last one are picked up.
        const enabledLocales = await getEnabledLocales();

        const { build, drop, ignored } = planRebuild(msg.locales, enabledLocales, Object.keys(index));

        for (const localeId of drop) {
          delete index[localeId];
          logger.warn(`Discarded food index for locale "${localeId}" because food indexing is no longer enabled for it.`);
        }

        for (const localeId of ignored)
          logger.warn(`Ignoring food index rebuild request for locale "${localeId}" because food indexing is not enabled for it.`);

        logger.debug(`Rebuilding index for ${build.size} locales`);

        const results = await buildIndexesForLocales(build);

        parentPort.postMessage({
          type: 'rebuild',
          id: msg.id,
          success: true,
          results,
          enabledLocales,
        });
      }
      catch (error) {
        // buildIndexesForLocales reports per-locale failures in its results, so this only catches a failure
        // to read the enabled locale list.
        parentPort.postMessage({
          type: 'rebuild',
          id: msg.id,
          success: false,
          error: toError(error),
        });
      }
      return;
    }

    case 'search':
      try {
        const results = await queryIndex(msg);

        parentPort.postMessage({
          type: 'search',
          id: msg.id,
          success: true,
          results,
        });
      }
      catch (error) {
        parentPort.postMessage({
          type: 'search',
          id: msg.id,
          success: false,
          // A missing index means the locale is unknown or no longer enabled, which the API reports as 404.
          errorType: error instanceof NotFoundError ? 'locale-not-indexed' : 'internal',
          error: toError(error),
        });
      }
      return;

    default:
      logger.error(`Unknown worker request: ${JSON.stringify(msg)}`);
  }
});

await databases.init();
await initialiseIndex();
