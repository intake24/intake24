import type { RankingData } from '@intake24/api/food-index/ranking/ranking';

import NodeCache from 'node-cache';

import { PopularityCounter } from '@intake24/db';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 600 });

export async function getGlobalPopularityRanking(foodCodes: string[]): Promise<RankingData> {
  const ranking = cache.mget<number>(foodCodes);

  const codesToFetch = foodCodes.filter(code => !ranking[code]);

  if (codesToFetch.length > 0) {
    const rows = await PopularityCounter.findAll({
      attributes: ['foodCode', 'counter'],
      where: { foodCode: codesToFetch },
    });

    const newCacheEntries = rows.map(row => ({
      key: row.foodCode,
      val: row.counter,
    }));

    cache.mset(newCacheEntries);

    rows.forEach((row) => {
      ranking[row.foodCode] = row.counter;
    });
  }

  return ranking;
}
