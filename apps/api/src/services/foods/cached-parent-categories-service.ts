import type { IoC } from '@intake24/api/ioc';
import type { UseInRecipeType } from '@intake24/common/types';
import type { InheritableAttributes, ResolvedInheritableAttributes } from '@intake24/common/types/http/admin';

import { sql } from 'kysely';

import { NotFoundError } from '@intake24/api/http/errors';
import { AttributeDefaults } from '@intake24/db/models';

import {
  getCategoryParentCategories as localGetCategoryParentCategories,
  getFoodParentCategories as localGetFoodParentCategories,
} from './common';

export type CacheRecord = {
  level: number;
  source: string;
  id: string | null;
  code: string | null;
  tags: string[];
  readyMealOption: boolean | null;
  reasonableAmount: number | null;
  sameAsBeforeOption: boolean | null;
  useInRecipes: UseInRecipeType | null;
};

export type ParentData = {
  ids: Set<string>;
  codes: Set<string>;
  attributes: InheritableAttributes[];
  tags: string[];
};

export type ResolvedParentData = {
  ids: string[];
  codes: string[];
  attributes: ResolvedInheritableAttributes;
  tags: string[];
};

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

  const completeAttributesWithDefaults = async (attributes: InheritableAttributes): Promise<ResolvedInheritableAttributes> => {
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

  const completeAttributes = (attributes: InheritableAttributes): ResolvedInheritableAttributes | undefined => {
    // Check if all attributes are defined (not null or undefined)
    if (Object.values(attributes).every(v => v != null)) {
      return attributes as ResolvedInheritableAttributes;
    }

    return undefined;
  };

  const processCacheRecords = async (records: CacheRecord[]): Promise<Record<string, ResolvedParentData | null>> => {
    const groupedRecords = records.reduce<Record<string, ParentData>>(
      (acc, { source, id, code, readyMealOption, reasonableAmount, sameAsBeforeOption, useInRecipes, tags }) => {
        if (!acc[source])
          acc[source] = { ids: new Set(), codes: new Set(), attributes: [], tags: [] };

        acc[source].attributes.push({ readyMealOption, reasonableAmount, sameAsBeforeOption, useInRecipes });
        acc[source].tags.push(...tags);

        if (!id || !code)
          return acc;

        acc[source].ids.add(id);
        acc[source].codes.add(code);

        return acc;
      },
      {},
    );

    const parentData: Record<string, ResolvedParentData | null> = {};

    for (const [key, { ids, codes, attributes, tags }] of Object.entries(groupedRecords)) {
      const maybeAttributes = attributes.reduce((attrAcc, attr) => {
        attrAcc.readyMealOption = attrAcc.readyMealOption ?? attr.readyMealOption ?? undefined;
        attrAcc.reasonableAmount = attrAcc.reasonableAmount ?? attr.reasonableAmount ?? undefined;
        attrAcc.sameAsBeforeOption = attrAcc.sameAsBeforeOption ?? attr.sameAsBeforeOption ?? undefined;
        attrAcc.useInRecipes = attrAcc.useInRecipes ?? attr.useInRecipes ?? undefined;
        return attrAcc;
      }, {});

      parentData[key] = {
        ids: [...ids].toSorted((a, b) => Number(a) - Number(b)),
        codes: [...codes].toSorted(),
        attributes: completeAttributes(maybeAttributes) ?? await completeAttributesWithDefaults(maybeAttributes),
        tags: [...new Set(tags)].toSorted(),
      };
    };

    return parentData;
  };

  async function getCategoryCache(ops: string | { code: string; localeId: string }): Promise<ResolvedParentData> {
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

    const { [categoryId]: data } = await getCategoriesCache(categoryId);
    if (!data)
      throw new NotFoundError(`Category with id ${categoryId} not found`);

    return data;
  }

  async function getCategoriesCache(id: string | string[]): Promise<Record<string, ResolvedParentData | null>> {
    return cache.rememberMany(Array.isArray(id) ? id : [id], 'category-parent-cache', cacheConfig.ttl, async (categoryId) => {
      const records = await kyselyDb.foods.withRecursive('rows', qb =>
      // The first query gets the food attributes
        qb.selectFrom('categories as c')
          .leftJoin('categoryAttributes as ca', 'c.id', 'ca.categoryId')
          .select([
            sql.lit(0).as('level'),
            'c.id as source',
            sql.lit<string | null>(null).as('id'),
            sql.lit<string | null>(null).as('code'),
            'c.tags',
            'ca.readyMealOption',
            'ca.reasonableAmount',
            'ca.sameAsBeforeOption',
            'ca.useInRecipes',
          ])
          .where('c.id', 'in', categoryId)
          // the second query gets the direct categories and their attributes
          .unionAll(qb =>
            qb.selectFrom('categoriesCategories as cc')
              .innerJoin('categories as c', 'cc.categoryId', 'c.id')
              .leftJoin('categoryAttributes as ca', 'cc.categoryId', 'ca.categoryId')
              .select([
                sql.lit(1).as('level'),
                'cc.subCategoryId as source',
                'c.id',
                'c.code',
                'c.tags',
                'ca.readyMealOption',
                'ca.reasonableAmount',
                'ca.sameAsBeforeOption',
                'ca.useInRecipes',
              ])
              .where('cc.subCategoryId', 'in', categoryId),
          )
          // the third query gets all parent categories and their attributes
          .unionAll(qb =>
            qb.selectFrom('categoriesCategories as cc')
              .innerJoin('categories as c', 'cc.categoryId', 'c.id')
              .leftJoin('categoryAttributes as ca', 'cc.categoryId', 'ca.categoryId')
              .innerJoin('rows', 'rows.id', 'cc.subCategoryId')
              .select([
                sql<number>`rows.level + 1`.as('level'),
                'rows.source',
                'c.id',
                'c.code',
                'c.tags',
                'ca.readyMealOption',
                'ca.reasonableAmount',
                'ca.sameAsBeforeOption',
                'ca.useInRecipes',
              ]),
          ))
        .selectFrom('rows')
        .selectAll()
        .orderBy('rows.source')
        .orderBy('rows.level')
        .execute();

      return await processCacheRecords(records);
    });
  }

  async function getFoodCache(ops: string | { code: string; localeId: string }): Promise<ResolvedParentData> {
    let foodId: string;
    if (typeof ops !== 'string') {
      const food = await kyselyDb.foods
        .selectFrom('foods')
        .select('id')
        .where('code', '=', ops.code)
        .where('localeId', '=', ops.localeId)
        .executeTakeFirstOrThrow();
      foodId = food.id;
    }
    else {
      foodId = ops;
    }

    const { [foodId]: data } = await getFoodsCache(foodId);
    if (!data)
      throw new NotFoundError(`Food with id ${foodId} not found`);

    return data;
  }

  async function getFoodsCache(id: string | string[]): Promise<Record<string, ResolvedParentData | null>> {
    return cache.rememberMany(Array.isArray(id) ? id : [id], 'food-parent-cache', cacheConfig.ttl, async (foodId) => {
      const records = await kyselyDb.foods.withRecursive('rows', qb =>
      // The first query gets the food attributes
        qb.selectFrom('foods as f')
          .leftJoin('foodAttributes as fa', 'f.id', 'fa.foodId')
          .select([
            sql.lit(0).as('level'),
            'f.id as source',
            sql.lit<string | null>(null).as('id'),
            sql.lit<string | null>(null).as('code'),
            'f.tags',
            'fa.readyMealOption',
            'fa.reasonableAmount',
            'fa.sameAsBeforeOption',
            'fa.useInRecipes',
          ])
          .where('f.id', 'in', foodId)
          // the second query gets the direct categories and their attributes
          .unionAll(qb =>
            qb.selectFrom('foodsCategories as fc')
              .innerJoin('categories as c', 'fc.categoryId', 'c.id')
              .leftJoin('categoryAttributes as ca', 'fc.categoryId', 'ca.categoryId')
              .select([
                sql.lit(1).as('level'),
                'fc.foodId as source',
                'c.id',
                'c.code',
                'c.tags',
                'ca.readyMealOption',
                'ca.reasonableAmount',
                'ca.sameAsBeforeOption',
                'ca.useInRecipes',
              ])
              .where('fc.foodId', 'in', foodId),
          )
          // the third query gets all parent categories and their attributes
          .unionAll(qb =>
            qb.selectFrom('categoriesCategories as cc')
              .innerJoin('categories as c', 'cc.categoryId', 'c.id')
              .leftJoin('categoryAttributes as ca', 'cc.categoryId', 'ca.categoryId')
              .innerJoin('rows', 'rows.id', 'cc.subCategoryId')
              .select([
                sql<number>`rows.level + 1`.as('level'),
                'rows.source',
                'c.id',
                'c.code',
                'c.tags',
                'ca.readyMealOption',
                'ca.reasonableAmount',
                'ca.sameAsBeforeOption',
                'ca.useInRecipes',
              ]),
          ))
        .selectFrom('rows')
        .selectAll()
        .orderBy('rows.source')
        .orderBy('rows.level')
        .execute();

      return await processCacheRecords(records);
    });
  }

  return {
    getFoodParentCategories,
    getCategoryParentCategories,
    getCategoryCache,
    getCategoriesCache,
    getFoodCache,
    getFoodsCache,
  };
}

export default cachedParentCategoriesService;

export type CachedParentCategoriesService = ReturnType<typeof cachedParentCategoriesService>;
