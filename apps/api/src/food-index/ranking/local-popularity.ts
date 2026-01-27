import type { RankingData } from '@intake24/api/food-index/ranking/ranking';

import NodeCache from 'node-cache';

import { toCacheKey, toFoodCode } from '@intake24/api/food-index/ranking/utils';
import { mapKeys } from '@intake24/common/util';
import { PAOccurrence } from '@intake24/db';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 600 });

export async function getLocalPopularityRanking(
  localeId: string,
  foods: string[],
): Promise<RankingData> {
  const keys = foods.map(code => toCacheKey(localeId, code));

  const ranking = mapKeys(cache.mget<number>(keys), k => toFoodCode(localeId, k));

  const codesToFetch = foods.filter(code => !ranking[code]);

  if (codesToFetch.length > 0) {
    const rows = await PAOccurrence.findAll({
      attributes: ['foodCode', 'occurrences', 'multiplier'],
      where: { localeId, foodCode: codesToFetch },
    });

    const newCacheEntries = rows.map(row => ({
      key: toCacheKey(localeId, row.foodCode),
      val: row.occurrences * (row.multiplier ?? 1),
    }));

    cache.mset(newCacheEntries);

    rows.forEach((row) => {
      ranking[row.foodCode] = row.occurrences * (row.multiplier ?? 1);
    });
  }

  return ranking;
}
