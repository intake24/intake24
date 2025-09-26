import { CategoryCategory, FoodCategory } from '@intake24/db';

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
