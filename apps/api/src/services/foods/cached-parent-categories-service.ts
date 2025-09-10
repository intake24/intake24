import type { IoC } from '@intake24/api/ioc';
import { Category, Food } from '@intake24/db';
import {
  getCategoryParentCategories as localGetCategoryParentCategories,
  getFoodParentCategories as localGetFoodParentCategories,
} from './common';

function cachedParentCategoriesService({
  cache,
  cacheConfig,
}: Pick<IoC, 'cache' | 'cacheConfig'>) {
  async function getFoodParentCategories(foodId: string): Promise<string[]> {
    return cache.remember<string[]>(
      `food-parent-categories:${foodId}`,
      cacheConfig.ttl,
      async () => localGetFoodParentCategories(foodId),
    );
  }

  async function getCategoryParentCategories(categoryId: string): Promise<string[]> {
    return cache.remember<string[]>(
      `category-parent-categories:${categoryId}`,
      cacheConfig.ttl,
      async () => localGetCategoryParentCategories([categoryId]),
    );
  }

  async function getFoodAllCategories(foodId: string): Promise<string[]> {
    return cache.remember<string[]>(
      `food-all-categories:${foodId}`,
      cacheConfig.ttl,
      async () => {
        let nextLevel = await getFoodParentCategories(foodId);
        const allCategories = new Set<string>();

        while (nextLevel.length > 0) {
          nextLevel.forEach(code => allCategories.add(code));
          nextLevel = await Promise.all(nextLevel.map(getCategoryParentCategories)).then(x =>
            x.flat(),
          );
        }

        return [...allCategories];
      },
    );
  }

  async function getFoodAllCategoryCodes(ops: string | { code: string; localeId: string }): Promise<string[]> {
    let foodId: string;

    if (typeof ops !== 'string') {
      const food = await Food.findOne({ where: ops, attributes: ['id', 'code', 'localeId'] });
      if (!food)
        return [];

      foodId = food.id;
    }
    else {
      foodId = ops;
    }

    return cache.remember<string[]>(
      `food-all-category-codes:${foodId}`,
      cacheConfig.ttl,
      async () => {
        const id = await getFoodAllCategories(foodId);
        const categories = await Category.findAll({ where: { id }, attributes: ['code'] });

        return categories.map(category => category.code);
      },
    );
  }

  async function getCategoryAllCategories(categoryId: string): Promise<string[]> {
    return cache.remember<string[]>(
      `category-all-categories:${categoryId}`,
      cacheConfig.ttl,
      async () => {
        let nextLevel = await getCategoryParentCategories(categoryId);
        const allCategories = new Set<string>();

        while (nextLevel.length > 0) {
          nextLevel.forEach(code => allCategories.add(code));
          nextLevel = await Promise.all(nextLevel.map(getCategoryParentCategories)).then(x =>
            x.flat(),
          );
        }

        return [...allCategories];
      },
    );
  }

  return {
    getFoodParentCategories,
    getCategoryParentCategories,
    getFoodAllCategories,
    getFoodAllCategoryCodes,
    getCategoryAllCategories,
  };
}

export default cachedParentCategoriesService;

export type CachedParentCategoriesService = ReturnType<typeof cachedParentCategoriesService>;
