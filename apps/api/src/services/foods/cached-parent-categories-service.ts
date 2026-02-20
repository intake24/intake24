import type { IoC } from '@intake24/api/ioc';

import {
  getCategoryParentCategories as localGetCategoryParentCategories,
  getFoodParentCategories as localGetFoodParentCategories,
} from './common';

function cachedParentCategoriesService({
  cache,
  cacheConfig,
  kyselyDb,
}: Pick<IoC, 'cache' | 'cacheConfig' | 'kyselyDb'>) {
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

  async function getFoodAllCategories(ops: string | { code: string; localeId: string }): Promise<{ ids: string[]; codes: string[] }> {
    let foodId: string;
    if (typeof ops !== 'string') {
      const food = await kyselyDb.foods
        .selectFrom('foods')
        .select(['id', 'code', 'localeId'])
        .where('code', '=', ops.code)
        .where('localeId', '=', ops.localeId)
        .executeTakeFirstOrThrow();
      foodId = food.id;
    }
    else {
      foodId = ops;
    }

    return cache.remember<{ ids: string[]; codes: string[] }>(
      `food-all-categories:${foodId}`,
      cacheConfig.ttl,
      async () => {
        const records = await kyselyDb.foods.withRecursive('rows', qb =>
          qb.selectFrom('foods as f')
            .innerJoin('foodsCategories as fc', 'f.id', 'fc.foodId')
            .innerJoin('categories as c', 'fc.categoryId', 'c.id')
            .select(['c.id', 'c.code'])
            .where('f.id', '=', foodId)
            .unionAll(qb =>
              qb.selectFrom('categoriesCategories as cc')
                .innerJoin('categories as c', 'cc.categoryId', 'c.id')
                .innerJoin('rows', 'rows.id', 'cc.subCategoryId')
                .select(['c.id', 'c.code']),
            ))
          .selectFrom('rows')
          .selectAll()
          .orderBy('rows.id')
          .execute();

        const categories = records.reduce<{ ids: string[]; codes: string[] }>(
          (acc, { id, code }) => {
            acc.ids.push(id);
            acc.codes.push(code);
            return acc;
          },
          { ids: [], codes: [] },
        );

        return {
          ids: categories.ids,
          codes: categories.codes.toSorted(),
        };
      },
    );
  }

  async function getCategoryAllCategories(ops: string | { code: string; localeId: string }): Promise<{ ids: string[]; codes: string[] }> {
    let categoryId: string;
    if (typeof ops !== 'string') {
      const food = await kyselyDb.foods
        .selectFrom('categories')
        .select('id')
        .where('code', '=', ops.code)
        .where('localeId', '=', ops.localeId)
        .executeTakeFirstOrThrow();
      categoryId = food.id;
    }
    else {
      categoryId = ops;
    }

    return cache.remember<{ ids: string[]; codes: string[] }>(
      `category-all-categories:${categoryId}`,
      cacheConfig.ttl,
      async () => {
        const records = await kyselyDb.foods.withRecursive('rows', qb =>
          qb.selectFrom('categoriesCategories as cc')
            .innerJoin('categories as c', 'cc.categoryId', 'c.id')
            .select(['c.id', 'c.code'])
            .where('cc.subCategoryId', '=', categoryId)
            .unionAll(qb =>
              qb.selectFrom('categoriesCategories as cc')
                .innerJoin('categories as c', 'cc.categoryId', 'c.id')
                .innerJoin('rows', 'rows.id', 'cc.subCategoryId')
                .select(['c.id', 'c.code']),
            ))
          .selectFrom('rows')
          .selectAll()
          .orderBy('rows.id')
          .execute();

        const categories = records.reduce<{ ids: string[]; codes: string[] }>(
          (acc, { id, code }) => {
            acc.ids.push(id);
            acc.codes.push(code);
            return acc;
          },
          { ids: [], codes: [] },
        );

        return {
          ids: categories.ids,
          codes: categories.codes.toSorted(),
        };
      },
    );
  }

  return {
    getFoodParentCategories,
    getCategoryParentCategories,
    getFoodAllCategories,
    getCategoryAllCategories,
  };
}

export default cachedParentCategoriesService;

export type CachedParentCategoriesService = ReturnType<typeof cachedParentCategoriesService>;
