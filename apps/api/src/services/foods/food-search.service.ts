import foodIndex from '@intake24/api/food-index';
import { applyDefaultSearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { OptionalSearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { IoC } from '@intake24/api/ioc';
import type { InheritableAttributes } from '@intake24/api/services/foods/types/inheritable-attributes';
import type { FoodSearchResponse } from '@intake24/common/types/http';

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

  const resolveCategoryAttributes = async (categoryCodes: string[]): Promise<Record<string, InheritableAttributes>> => {
    const data = await Promise.all(
      categoryCodes.map(code => inheritableAttributesService.resolveCategoryAttributes(code)),
    );

    return Object.fromEntries(categoryCodes.map((code, index) => [code, data[index]]));
  };

  const resolveFoodAttributes = async (foodCodes: string[]): Promise<Record<string, InheritableAttributes>> => {
    const data = await Promise.all(
      foodCodes.map(code => inheritableAttributesService.resolveFoodAttributes(code)),
    );

    return Object.fromEntries(foodCodes.map((code, index) => [code, data[index]]));
  };

  const getCategoryAttributes = async (categoryCodes: string[]): Promise<Record<string, InheritableAttributes | null>> => {
    return cache.rememberMany(categoryCodes, 'category-attributes', cacheConfig.ttl, resolveCategoryAttributes);
  };

  const getFoodAttributes = async (foodCodes: string[]): Promise<Record<string, InheritableAttributes | null>> => {
    return cache.rememberMany(foodCodes, 'food-attributes', cacheConfig.ttl, resolveFoodAttributes);
  };

  const search = async (localeId: string, description: string, isRecipe: boolean, options: OptionalSearchQueryParameters): Promise<FoodSearchResponse> => {
    const queryParameters = applyDefaultSearchQueryParameters(localeId, description, options);
    const results = await foodIndex.search(queryParameters);

    const catCodes = results.categories.map(({ code }) => code);
    const foodCodes = results.foods.map(({ code }) => code);

    const [categoryAttrs, foodAttrs, thumbnailImages] = await Promise.all([
      getCategoryAttributes(catCodes),
      getFoodAttributes(foodCodes),
      foodThumbnailImageService.resolveImages(localeId, foodCodes),
    ]);

    const withFilteredIngredients = {
      foods: results.foods.reduce<FoodSearchResponse['foods']>((acc, food) => {
        if (!acceptForQuery(isRecipe, foodAttrs[food.code]?.useInRecipes))
          return acc;

        acc.push({ ...food, thumbnailImageUrl: thumbnailImages[food.code] });

        return acc;
      }, []),
      categories: results.categories.filter(category => acceptForQuery(isRecipe, categoryAttrs[category.code]?.useInRecipes)),
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
