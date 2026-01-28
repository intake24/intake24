import type { OptionalSearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { IoC } from '@intake24/api/ioc';
import type { FoodSearchResponse } from '@intake24/common/types/http';

import foodIndex from '@intake24/api/food-index';
import { applyDefaultSearchQueryParameters } from '@intake24/api/food-index/search-query';

function foodSearchService({
  inheritableAttributesService,
  foodThumbnailImageService,
}: Pick<IoC, 'inheritableAttributesService' | 'foodThumbnailImageService'>) {
  const { getCategoryAttributes, getFoodAttributes, acceptForQuery } = inheritableAttributesService;

  const search = async (localeId: string, description: string, isRecipe: boolean, options: OptionalSearchQueryParameters): Promise<FoodSearchResponse> => {
    const queryParameters = applyDefaultSearchQueryParameters(localeId, description, options);
    const results = await foodIndex.search(queryParameters);

    const catIds = results.categories.map(({ id }) => id);
    const foodIds = results.foods.map(({ id }) => id);

    const [categoryAttrs, foodAttrs, thumbnailImages] = await Promise.all([
      getCategoryAttributes(catIds),
      getFoodAttributes(foodIds),
      foodThumbnailImageService.resolveImages(foodIds),
    ]);

    const withFilteredIngredients = {
      foods: results.foods.reduce<FoodSearchResponse['foods']>((acc, food) => {
        if (!acceptForQuery(isRecipe, foodAttrs[food.id]?.useInRecipes))
          return acc;

        acc.push({ ...food, thumbnailImageUrl: thumbnailImages[food.id] });

        return acc;
      }, []),
      categories: results.categories.filter(category => acceptForQuery(isRecipe, categoryAttrs[category.id]?.useInRecipes)),
    };

    return withFilteredIngredients;
  };

  return {
    getFoodAttributes,
    search,
  };
}

export default foodSearchService;

export type FoodSearchService = ReturnType<
  typeof foodSearchService
>;
