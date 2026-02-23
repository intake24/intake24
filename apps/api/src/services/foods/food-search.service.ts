import type { OptionalSearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { IoC } from '@intake24/api/ioc';
import type { FoodSearchResponse } from '@intake24/common/types/http';

import foodIndex from '@intake24/api/food-index';
import { applyDefaultSearchQueryParameters } from '@intake24/api/food-index/search-query';

import { acceptForQuery } from './common';

function foodSearchService({ foodThumbnailImageService, cachedParentCategoriesService }: Pick<IoC, 'foodThumbnailImageService' | 'cachedParentCategoriesService'>) {
  const search = async (localeId: string, description: string, isRecipe: boolean, options: OptionalSearchQueryParameters): Promise<FoodSearchResponse> => {
    const queryParameters = applyDefaultSearchQueryParameters(localeId, description, options);
    const results = await foodIndex.search(queryParameters);

    const catIds = results.categories.map(({ id }) => id);
    const foodIds = results.foods.map(({ id }) => id);

    const [categoryCache, foodCache, thumbnailImages] = await Promise.all([
      cachedParentCategoriesService.getCategoriesCache(catIds),
      cachedParentCategoriesService.getFoodsCache(foodIds),
      foodThumbnailImageService.resolveImages(foodIds),
    ]);

    const withFilteredIngredients = {
      foods: results.foods.reduce<FoodSearchResponse['foods']>((acc, food) => {
        if (!acceptForQuery(isRecipe, foodCache[food.id]?.attributes.useInRecipes))
          return acc;

        acc.push({ ...food, thumbnailImageUrl: thumbnailImages[food.id] });

        return acc;
      }, []),
      categories: results.categories.filter(category => acceptForQuery(isRecipe, categoryCache[category.id]?.attributes.useInRecipes)),
    };

    return withFilteredIngredients;
  };

  return {
    search,
  };
}

export default foodSearchService;

export type FoodSearchService = ReturnType<typeof foodSearchService>;
