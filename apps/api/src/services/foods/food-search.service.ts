import type { OptionalSearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { IoC } from '@intake24/api/ioc';
import type { InheritableAttributes } from '@intake24/api/services/foods/types/inheritable-attributes';
import type { FoodSearchResponse } from '@intake24/common/types/http';

import foodIndex from '@intake24/api/food-index';
import { applyDefaultSearchQueryParameters } from '@intake24/api/food-index/search-query';

// const ATTR_USE_ANYWHERE = 0;
const ATTR_AS_REGULAR_FOOD_ONLY = 1;
const ATTR_AS_RECIPE_INGREDIENT_ONLY = 2;

function foodSearchService({
  inheritableAttributesService,
  foodThumbnailImageService,
  cache,
  cacheConfig,
}: Pick<IoC, 'inheritableAttributesService' | 'foodThumbnailImageService' | 'cache' | 'cacheConfig'>) {
  function acceptForQuery(recipe: boolean, attrOpt?: number): boolean {
    const attr = attrOpt ?? ATTR_AS_REGULAR_FOOD_ONLY;

    switch (attr) {
      case ATTR_AS_REGULAR_FOOD_ONLY:
        return !recipe;
      case ATTR_AS_RECIPE_INGREDIENT_ONLY:
        return recipe;
      default:
        return true;
    }
  }

  const resolveCategoryAttributes = async (categoryIds: string[]): Promise<Record<string, InheritableAttributes>> => {
    const data = await Promise.all(
      categoryIds.map(id => inheritableAttributesService.resolveCategoryAttributes(id)),
    );

    return Object.fromEntries(categoryIds.map((id, index) => [id, data[index]]));
  };

  const resolveFoodAttributes = async (foodIds: string[]): Promise<Record<string, InheritableAttributes>> => {
    const data = await Promise.all(
      foodIds.map(id => inheritableAttributesService.resolveFoodAttributes(id)),
    );

    return Object.fromEntries(foodIds.map((id, index) => [id, data[index]]));
  };

  const getCategoryAttributes = async (categoryIds: string[]): Promise<Record<string, InheritableAttributes | null>> => {
    return cache.rememberMany(categoryIds, 'category-attributes', cacheConfig.ttl, resolveCategoryAttributes);
  };

  const getFoodAttributes = async (foodIds: string[]): Promise<Record<string, InheritableAttributes | null>> => {
    return cache.rememberMany(foodIds, 'food-attributes', cacheConfig.ttl, resolveFoodAttributes);
  };

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
