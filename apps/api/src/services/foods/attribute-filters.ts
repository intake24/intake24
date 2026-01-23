// Shared helper and attribute resolvers used by food/category search flows.
import type { IoC } from '@intake24/api/ioc';
import type { InheritableAttributes } from '@intake24/api/services/foods/types/inheritable-attributes';

const ATTR_AS_REGULAR_FOOD_ONLY = 1;
const ATTR_AS_RECIPE_INGREDIENT_ONLY = 2;

export function acceptForQuery(recipe: boolean, attrOpt?: number): boolean {
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

export function buildAttributeResolvers({
  inheritableAttributesService,
  cache,
  cacheConfig,
}: Pick<IoC, 'inheritableAttributesService' | 'cache' | 'cacheConfig'>) {
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

  return {
    resolveCategoryAttributes,
    resolveFoodAttributes,
    getCategoryAttributes,
    getFoodAttributes,
  };
}
