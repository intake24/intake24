import { useInRecipeTypes } from '@intake24/common/types';
import { CategoryCategory, FoodCategory } from '@intake24/db';

export function acceptForQuery(recipe: boolean, attrOpt?: number): boolean {
  const attr = attrOpt ?? useInRecipeTypes.USE_AS_REGULAR_FOOD;

  switch (attr) {
    case useInRecipeTypes.USE_AS_REGULAR_FOOD:
      return !recipe;
    case useInRecipeTypes.USE_AS_RECIPE_INGREDIENT:
      return recipe;
    default:
      return true;
  }
}

export async function getFoodParentCategories(foodId: string): Promise<string[]> {
  const categories = await FoodCategory.findAll({
    where: { foodId },
    attributes: ['categoryId'],
    order: [['categoryId', 'ASC']],
  });

  return categories.map(row => row.categoryId);
}

export async function getCategoryParentCategories(subCategoryId: string[]): Promise<string[]> {
  const categories = await CategoryCategory.findAll({
    where: { subCategoryId },
    attributes: ['categoryId'],
    order: [['categoryId', 'ASC']],
  });

  return categories.map(row => row.categoryId);
}
