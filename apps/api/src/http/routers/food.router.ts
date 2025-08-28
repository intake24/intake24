import { initServer } from '@ts-rest/express';
import foodIndex from '@intake24/api/food-index';
import type { OptionalSearchQueryParameters } from '@intake24/api/food-index/search-query';
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
      const categories
        = await req.scope.cradle.cachedParentCategoriesService.getFoodAllCategoryCodes({ code, localeId });

      return { status: 200, body: categories };
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
    recipeFood: async ({ params }) => {
      const { code, localeId } = params;
      // TODO: implement via the food index by adding a new query type and a message handling/switching between message types
      const result = await foodIndex.getRecipeFood(localeId, code);

      return { status: 200, body: {
        ...result.get(),
        steps: result.steps ?? [],
      } };
    },
  });
}
