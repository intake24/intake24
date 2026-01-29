import type { IoC } from '@intake24/api/ioc';
import type { InheritableAttributes } from '@intake24/api/services/foods/types/inheritable-attributes';

import { getCategoryParentCategories, getFoodParentCategories } from '@intake24/api/services/foods/common';
import { useInRecipeTypes } from '@intake24/common/types';
import { AttributeDefaults, CategoryAttribute, FoodAttribute } from '@intake24/db';

function inheritableAttributesService({
  cache,
  cacheConfig,
}: Pick<IoC, 'cache' | 'cacheConfig'>) {
  const acceptForQuery = (recipe: boolean, attrOpt?: number): boolean => {
    const attr = attrOpt ?? useInRecipeTypes.USE_AS_REGULAR_FOOD;

    switch (attr) {
      case useInRecipeTypes.USE_AS_REGULAR_FOOD:
        return !recipe;
      case useInRecipeTypes.USE_AS_RECIPE_INGREDIENT:
        return recipe;
      default:
        return true;
    }
  };
  const completeAttributes = (
    attributes: Partial<InheritableAttributes>,
  ): InheritableAttributes | undefined => {
    // Check if all attributes are defined (not null or undefined)
    if (Object.values(attributes).every(v => v != null)) {
      return attributes as InheritableAttributes;
    }

    return undefined;
  };

  const completeAttributesWithDefaults = async (
    attributes: Partial<InheritableAttributes>,
  ): Promise<InheritableAttributes> => {
    const [defaults] = await AttributeDefaults.findAll({ limit: 1 });

    if (defaults) {
      return {
        readyMealOption: attributes.readyMealOption ?? defaults.readyMealOption,
        sameAsBeforeOption: attributes.sameAsBeforeOption ?? defaults.sameAsBeforeOption,
        reasonableAmount: attributes.reasonableAmount ?? defaults.reasonableAmount,
        useInRecipes: attributes.useInRecipes ?? defaults.useInRecipes,
      };
    }

    throw new Error(
      'Cannot resolve default inheritable attributes because the \'attributes_defaults\' table is empty',
    );
  };

  const resolveAttributesRec = async (
    parentCategories: string[],
    attributes: Partial<InheritableAttributes>,
  ): Promise<InheritableAttributes> => {
    if (!parentCategories.length)
      return completeAttributesWithDefaults(attributes);

    const parentAttributesRows = await CategoryAttribute.findAll({
      where: { categoryId: parentCategories },
      order: [['categoryId', 'ASC']],
    });

    const newAttributes: Partial<InheritableAttributes> = { ...attributes };

    parentAttributesRows.forEach((row) => {
      newAttributes.readyMealOption = newAttributes.readyMealOption ?? row.readyMealOption ?? undefined;
      newAttributes.reasonableAmount = newAttributes.reasonableAmount ?? row.reasonableAmount ?? undefined;
      newAttributes.sameAsBeforeOption = newAttributes.sameAsBeforeOption ?? row.sameAsBeforeOption ?? undefined;
      newAttributes.useInRecipes = newAttributes.useInRecipes ?? row.useInRecipes ?? undefined;
    });

    const maybeComplete = completeAttributes(newAttributes);

    if (maybeComplete)
      return maybeComplete;

    const nextParents = await getCategoryParentCategories(parentCategories);

    return resolveAttributesRec(nextParents, newAttributes);
  };

  async function resolveCategoryAttributes(categoryId: string): Promise<InheritableAttributes> {
    const catAttributes = await CategoryAttribute.findOne({ where: { categoryId } });

    const attributes: Partial<InheritableAttributes> = {
      readyMealOption: catAttributes?.readyMealOption ?? undefined,
      reasonableAmount: catAttributes?.reasonableAmount ?? undefined,
      sameAsBeforeOption: catAttributes?.sameAsBeforeOption ?? undefined,
      useInRecipes: catAttributes?.useInRecipes ?? undefined,
    };

    const maybeComplete = completeAttributes(attributes);
    if (maybeComplete)
      return maybeComplete;

    const parentCategories = await getCategoryParentCategories([categoryId]);

    return resolveAttributesRec(parentCategories, attributes);
  }

  async function resolveFoodAttributes(foodId: string): Promise<InheritableAttributes> {
    const foodAttributesRow = await FoodAttribute.findOne({ where: { foodId } });

    const attributes: Partial<InheritableAttributes> = {
      readyMealOption: foodAttributesRow?.readyMealOption ?? undefined,
      reasonableAmount: foodAttributesRow?.reasonableAmount ?? undefined,
      sameAsBeforeOption: foodAttributesRow?.sameAsBeforeOption ?? undefined,
      useInRecipes: foodAttributesRow?.useInRecipes ?? undefined,
    };

    const maybeComplete = completeAttributes(attributes);
    if (maybeComplete)
      return maybeComplete;

    const parentCategories = await getFoodParentCategories(foodId);

    return resolveAttributesRec(parentCategories, attributes);
  }

  const getCategoryAttributes = async (categoryIds: string[]): Promise<Record<string, InheritableAttributes | null>> => {
    return cache.rememberMany(categoryIds, 'category-attributes', cacheConfig.ttl, async (ids) => {
      const data = await Promise.all(ids.map(id => resolveCategoryAttributes(id)));
      return Object.fromEntries(ids.map((id, index) => [id, data[index]]));
    });
  };

  const getFoodAttributes = async (foodIds: string[]): Promise<Record<string, InheritableAttributes | null>> => {
    return cache.rememberMany(foodIds, 'food-attributes', cacheConfig.ttl, async (ids) => {
      const data = await Promise.all(ids.map(id => resolveFoodAttributes(id)));
      return Object.fromEntries(ids.map((id, index) => [id, data[index]]));
    });
  };

  return {
    resolveCategoryAttributes,
    resolveFoodAttributes,
    acceptForQuery,
    getCategoryAttributes,
    getFoodAttributes,
  };
}

export default inheritableAttributesService;

export type InheritableAttributesService = ReturnType<typeof inheritableAttributesService>;
