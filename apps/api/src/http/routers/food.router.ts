import type { OptionalSearchQueryParameters } from '@intake24/api/food-index/search-query';

import { initServer } from '@ts-rest/express';

import { contract } from '@intake24/common/contracts';

export function food() {
  return initServer().router(contract.food, {
    entry: async ({ params, req }) => {
      const { foodId } = params;

      const response = await req.scope.cradle.cache.remember(
        `food-entry:${foodId}`,
        req.scope.cradle.cacheConfig.ttl,
        async () => req.scope.cradle.foodDataService.getFoodData({ id: foodId }),
      );

      return { status: 200, body: response };
    },
    codeEntry: async ({ params, req }) => {
      const { code, localeId } = params;

      const response = await req.scope.cradle.cache.remember(
        `food-entry:${localeId}:${code}`,
        req.scope.cradle.cacheConfig.ttl,
        async () => req.scope.cradle.foodDataService.getFoodData({ code, localeId }),
      );

      return { status: 200, body: response };
    },
    categories: async ({ params, req }) => {
      const { code, localeId } = params;
      const { codes }
        = await req.scope.cradle.cachedParentCategoriesService.getFoodCache({ code, localeId });

      return { status: 200, body: codes };
    },
    search: async ({ params, query, req }) => {
      const { description, matchScoreWeight, rankingAlgorithm, hidden, category: limitToCategory, limit, previous, recipe } = query;
      const { localeId } = params;

      const searchOptions: OptionalSearchQueryParameters = {
        previous,
        limit,
        includeHidden: hidden === 'true',
        rankingAlgorithm,
        matchScoreWeight,
        limitToCategory,
      };

      const searchResults = await req.scope.cradle.foodSearchService.search(localeId, description, recipe === 'true', searchOptions);

      return { status: 200, body: searchResults };
    },
    builders: async ({ query: { code }, params: { localeId }, req }) => {
      const builders = await req.scope.cradle.foodDataService.getFoodBuilders(localeId, code);

      return { status: 200, body: builders };
    },
    builder: async ({ params, req }) => {
      const { code, localeId } = params;

      const builder = await req.scope.cradle.foodDataService.getFoodBuilder(localeId, code);

      return { status: 200, body: builder };
    },
  });
}
