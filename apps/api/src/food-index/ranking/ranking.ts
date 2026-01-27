import type { PhraseMatchResult } from '@intake24/api/food-index/phrase-index';
import type { Logger } from '@intake24/common-backend';
import type { SearchSortingAlgorithm } from '@intake24/common/surveys';
import type { CategoryHeader, FoodHeader } from '@intake24/common/types/http';

import { getFixedRanking } from '@intake24/api/food-index/ranking/fixed-ranking';
import { getGlobalPopularityRanking } from '@intake24/api/food-index/ranking/global-popularity';
import { getLocalPopularityRanking } from '@intake24/api/food-index/ranking/local-popularity';

export type RankingAlgorithm = '';

export type RankingData = {
  [foodCode: string]: number;
};

function noAlgorithmRanking(results: PhraseMatchResult<string>[]): FoodHeader[] {
  return results
    .sort((a, b) => a.quality - b.quality)
    .map(result => ({ id: result.id, code: result.key, name: result.phrase }));
}

function mapValues<T1, T2>(obj: { [s: string]: T1 }, fn: (value: T1) => T2): { [s: string]: T2 } {
  const entries = Object.entries(obj);
  return Object.fromEntries(entries.map(entry => [entry[0], fn(entry[1])]));
}

function normaliseRankingData(ranking: RankingData): RankingData {
  if (Object.keys(ranking).length === 0)
    return {};

  // Minimum value can be either zero or Math.min(...Object.values(ranking)).
  //
  // In this case it seems more natural to use 0 so that the combined value of
  // ranking data and match score is more fairly distributed.
  //
  // For example, if the incoming ranking data is [50, 100] it could either be
  // normalised as [0, 1] (if the minimum value is used as the lower bound) or
  // as [0.5, 1] (if 0 is used as the lower bound).
  //
  // Since the initial frequency/lowest priority is 0, it makes more sense
  // if the lowest non-zero frequency data is mapped to a non-zero value.
  const min = 0;
  const max = Math.max(...Object.values(ranking));

  const range = max - min;

  if (Math.abs(range) < 1e-6) {
    // Map single or repeating values to 1
    return mapValues(ranking, _ => 1);
  }
  else {
    return mapValues(ranking, v => (v - min) / range);
  }
}

function normaliseMatchCost(results: PhraseMatchResult<string>[]): PhraseMatchResult<string>[] {
  if (results.length === 0)
    return [];

  const costs = results.map(r => r.quality);

  const min = Math.min(...costs);
  const max = Math.max(...costs);

  const range = max - min;

  // Convert match cost to score, i.e. higher is better
  if (Math.abs(range) < 1e-6) {
    return results.map(r => ({ id: r.id, key: r.key, phrase: r.phrase, quality: 1 }));
  }
  else {
    return results.map(r => ({
      id: r.id,
      key: r.key,
      phrase: r.phrase,
      quality: 1.0 - (r.quality - min) / range,
    }));
  }
}

function applyRankingData(
  rankingData: RankingData,
  results: PhraseMatchResult<string>[],
  matchScoreWeight: number,
  logger: Logger,
): FoodHeader[] {
  const normalisedRankingData = normaliseRankingData(rankingData);
  const normalisedSearchResults = normaliseMatchCost(results);

  const combinedScoreResults = normalisedSearchResults
    .map((result) => {
      let rankingScore = normalisedRankingData[result.key];

      if (rankingScore === undefined) {
        logger.warn(`No ranking data for food code "${result.key}"`);
        rankingScore = 0;
      }

      const combinedScore
        = rankingScore * (1 - matchScoreWeight) + result.quality * matchScoreWeight;

      return {
        header: { id: result.id, code: result.key, name: result.phrase },
        rankingScore: combinedScore,
      };
    });

  const sortedResults = combinedScoreResults.sort((h1, h2) => h2.rankingScore - h1.rankingScore);

  return sortedResults.map(h => h.header);
}

async function getRankingData(
  algorithm: SearchSortingAlgorithm,
  localeId: string,
  foodCodes: string[],
  logger: Logger,
): Promise<RankingData | null> {
  switch (algorithm) {
    case 'fixed':
      return getFixedRanking(localeId, foodCodes);
    case 'globalPop':
      return getGlobalPopularityRanking(foodCodes);
    case 'popularity':
      return getLocalPopularityRanking(localeId, foodCodes);
    default: {
      logger.warn(`Ranking algorithm "${algorithm}" is not supported`);
      return null;
    }
  }
}

export async function rankFoodResults(
  results: PhraseMatchResult<string>[],
  localeId: string,
  algorithm: SearchSortingAlgorithm,
  matchScoreWeight: number,
  logger: Logger,
  recipeFoodsHeaders: FoodHeader[],
): Promise<FoodHeader[]> {
  const foodCodes = results.map(result => result.key);
  const rankingData = await getRankingData(algorithm, localeId, foodCodes, logger);

  if (rankingData !== null) {
    return recipeFoodsHeaders.concat(
      applyRankingData(rankingData, results, matchScoreWeight, logger),
    );
  }
  else {
    return recipeFoodsHeaders.concat(noAlgorithmRanking(results));
  }
}

export function rankCategoryResults(results: PhraseMatchResult<string>[]): CategoryHeader[] {
  return results
    .sort((a, b) => a.quality - b.quality)
    .map(result => ({ id: result.id, code: result.key, name: result.phrase }));
}
