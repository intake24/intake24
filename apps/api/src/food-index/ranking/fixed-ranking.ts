import type { RankingData } from '@intake24/api/food-index/ranking/ranking';

import NodeCache from 'node-cache';

import { toCacheKey, toFoodCode } from '@intake24/api/food-index/ranking/utils';
import { mapKeys } from '@intake24/common/util';
import { FixedFoodRanking } from '@intake24/db';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 600 });

export async function getFixedRanking(localeId: string, foods: string[]): Promise<RankingData> {
  const keys = foods.map(code => toCacheKey(localeId, code));

  const ranking = mapKeys(cache.mget<number>(keys), k => toFoodCode(localeId, k));

  const codesToFetch = foods.filter(code => !ranking[code]);

  if (codesToFetch.length > 0) {
    const rows = await FixedFoodRanking.findAll({
      attributes: ['foodCode', 'rank'],
      where: { localeId, foodCode: codesToFetch },
    });

    const newCacheEntries = rows.map(row => ({
      key: toCacheKey(localeId, row.foodCode),
      val: row.rank,
    }));

    cache.mset(newCacheEntries);

    rows.forEach((row) => {
      ranking[row.foodCode] = row.rank;
    });
  }

  return ranking;
}
