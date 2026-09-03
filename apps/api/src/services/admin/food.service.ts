import type { Insertable, Kysely } from 'kysely';
import type { FindOptions } from 'sequelize';

import type { CacheKey } from '../core/redis/cache';
import type { IoC } from '@intake24/api/ioc';
import type { BulkFoodInput, FoodCopyInput, FoodInput } from '@intake24/common/types/http/admin';
import type { AssociatedFood, FoodAttributes, FoodPortionSizeMethod, FoodsDB, OnConflictOption, PaginateQuery } from '@intake24/db';

import { randomUUID } from 'node:crypto';

import { pick } from 'lodash-es';
import { Op } from 'sequelize';

import { ConflictError, NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { foodsResponse } from '@intake24/api/http/responses/admin';
import { toSimpleName } from '@intake24/api/util';
import { Food } from '@intake24/db';

function adminFoodService({ cache, kyselyDb }: Pick<IoC, 'cache' | 'kyselyDb'>) {
  function getFoodCacheKeys(localeId: string, foodId: string, foodCode: string): CacheKey[] {
    return [
      `food-entry:${foodId}`,
      `food-entry:${localeId}:${foodCode}`,
      `food-parent-cache:${foodId}`,
      `food-parent-categories:${foodId}`,
    ];
  }

  const browseFoods = async (localeId: string, query: PaginateQuery) => {
    const options: FindOptions<FoodAttributes> = { where: { localeId } };
    const { search } = query;

    if (search) {
      const ops = ['code', 'englishName', 'name'].map(column => ({ [column]: { [Op.iLike]: `%${search}%` } }));
      options.where = { ...options.where, [Op.or]: ops };
    }

    return Food.paginate({ query, transform: foodsResponse, ...options });
  };

  const getFood = async (foodId: { id: string; localeId?: string } | { code: string; localeId: string }) => {
    return await Food.findOne({
      where: { ...foodId },
      include: [
        { association: 'attributes' },
        { association: 'brands' },
        {
          association: 'parentCategories',
          through: { attributes: [] },
        },
        {
          association: 'associatedFoods',
          separate: true,
          order: [['orderBy', 'ASC']],
        },
        {
          association: 'portionSizeMethods',
          separate: true,
          order: [['orderBy', 'ASC']],
        },
        { association: 'nutrientRecords', through: { attributes: [] } },
      ],
    });
  };

  const updatePortionSizeMethods = async (
    foodId: string,
    methods: FoodPortionSizeMethod[],
    inputs: FoodInput['portionSizeMethods'],
    { transaction }: { transaction: Kysely<FoodsDB> },
  ): Promise<void> => {
    if (!inputs)
      return;

    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await transaction
      .deleteFrom('foodPortionSizeMethods')
      .where('foodId', '=', foodId)
      .$if(!!ids.length, qb => qb.where('id', 'not in', ids))
      .execute();

    if (!inputs.length)
      return;

    for (const input of inputs) {
      const { id, ...rest } = input;

      if (id) {
        const match = methods.find(method => method.id === id);
        if (match) {
          await transaction.updateTable('foodPortionSizeMethods').set(rest).where('id', '=', id).execute();
          continue;
        }
      }

      await transaction.insertInto('foodPortionSizeMethods').values({ ...rest, foodId }).execute();
    }
  };

  const updateAssociatedFoods = async (
    foodId: string,
    foods: AssociatedFood[],
    inputs: FoodInput['associatedFoods'],
    { transaction }: { transaction: Kysely<FoodsDB> },
  ): Promise<void> => {
    if (!inputs)
      return;

    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await transaction
      .deleteFrom('associatedFoods')
      .where('foodId', '=', foodId)
      .$if(!!ids.length, qb => qb.where('id', 'not in', ids))
      .execute();

    if (!inputs.length)
      return;

    for (const input of inputs) {
      const { id, ...rest } = input;

      if (id) {
        const match = foods.find(food => food.id === id);
        if (match) {
          // await match.update(rest, { transaction });
          await transaction.updateTable('associatedFoods').set(rest).where('id', '=', id).execute();
          continue;
        }
      }

      await transaction.insertInto('associatedFoods').values({ ...rest, foodId }).execute();
    }
  };

  const createFood = async (localeId: string, input: FoodInput) => {
    const food = await kyselyDb.foods.contextTransaction(async (transaction) => {
      const food = await transaction.insertInto('foods').values({
        ...pick(input, ['code', 'englishName', 'name', 'altNames', 'tags', 'icon']),
        localeId,
        simpleName: toSimpleName(input.name),
        version: randomUUID(),
      }).returningAll().executeTakeFirstOrThrow();

      const promises: Promise<any>[] = [
        cache.setAdd('locales-index', localeId),
        updatePortionSizeMethods(food.id, [], input.portionSizeMethods, { transaction }),
        updateAssociatedFoods(food.id, [], input.associatedFoods, { transaction }),
      ];

      if (input.parentCategories?.length) {
        const categories = input.parentCategories.map(({ id }) => id);
        promises.push(
          transaction
            .insertInto('foodsCategories')
            .values(categories.map(categoryId => ({ foodId: food.id, categoryId })))
            .execute(),
        );
      }

      if (input.attributes) {
        const attributesInput = pick(input.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);
        if (Object.values(attributesInput).some(item => item !== null)) {
          promises.push(transaction
            .insertInto('foodAttributes')
            .values({ foodId: food.id, ...attributesInput })
            .execute(),
          );
        }
      }

      if (input.nutrientRecords?.length) {
        const nutrientRecords = input.nutrientRecords.map(({ id }) => id);
        promises.push(
          transaction
            .insertInto('foodsNutrients')
            .values(nutrientRecords.map(nutrientTableRecordId => ({ foodId: food.id, nutrientTableRecordId })))
            .execute(),
        );
      }

      await Promise.all(promises);

      return food;
    });

    return (await getFood({ id: food.id, localeId }))!;
  };

  const updateFood = async (localeId: string, foodId: string, input: FoodInput) => {
    const food = await getFood({ id: foodId, localeId });
    if (!food)
      throw new NotFoundError();

    const { associatedFoods, attributes, portionSizeMethods, parentCategories } = food;
    if (!associatedFoods || !portionSizeMethods)
      throw new NotFoundError();

    await kyselyDb.foods.contextTransaction(async (transaction) => {
      const promises: Promise<any>[] = [
        cache.forget(getFoodCacheKeys(localeId, foodId, food.code)),
        cache.setAdd('locales-index', localeId),
        transaction.updateTable('foods').set({
          ...pick(input, ['code', 'englishName', 'name', 'altNames', 'tags', 'icon']),
          simpleName: toSimpleName(input.name),
          version: randomUUID(),
        }).where('id', '=', foodId).execute(),
        updatePortionSizeMethods(foodId, portionSizeMethods, input.portionSizeMethods, { transaction }),
        updateAssociatedFoods(foodId, associatedFoods, input.associatedFoods, { transaction }),
      ];

      if (input.parentCategories) {
        const currentCategories = parentCategories?.map(({ id }) => id) ?? [];
        const categories = input.parentCategories.map(({ id }) => id);
        const inserts = categories.filter(categoryId => !currentCategories.includes(categoryId));
        promises.push(
          transaction.deleteFrom('foodsCategories')
            .where('foodId', '=', foodId)
            .$if(!!categories.length, qb => qb.where('categoryId', 'not in', categories))
            .execute(),
        );

        if (inserts.length) {
          promises.push(
            transaction.insertInto('foodsCategories')
              .values(inserts.map(categoryId => ({ foodId, categoryId })))
              .execute(),
          );
        }
      }

      if (input.attributes) {
        const attributesInput = pick(input.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);
        if (Object.values(attributesInput).every(item => item === null)) {
          if (attributes)
            promises.push(transaction.deleteFrom('foodAttributes').where('foodId', '=', foodId).execute());
        }
        else {
          promises.push(
            attributes
              ? transaction.updateTable('foodAttributes').set(attributesInput).where('foodId', '=', foodId).execute()
              : transaction.insertInto('foodAttributes').values({ foodId, ...attributesInput }).execute(),
          );
        }
      }

      if (input.nutrientRecords) {
        const currentNutrientRecords = food.nutrientRecords?.map(({ id }) => id) ?? [];
        const nutrientRecords = input.nutrientRecords.map(({ id }) => id);
        const inserts = nutrientRecords.filter(nutrientTableRecordId => !currentNutrientRecords.includes(nutrientTableRecordId));
        promises.push(
          transaction.deleteFrom('foodsNutrients')
            .where('foodId', '=', foodId)
            .$if(!!nutrientRecords.length, qb => qb.where('nutrientTableRecordId', 'not in', nutrientRecords))
            .execute(),
        );

        if (inserts.length) {
          promises.push(
            transaction.insertInto('foodsNutrients')
              .values(inserts.map(nutrientTableRecordId => ({ foodId, nutrientTableRecordId })))
              .execute(),
          );
        }
      }

      await Promise.all(promises);
    });

    return (await getFood({ id: foodId, localeId }))!;
  };

  const copyFood = async (localeId: string, foodId: string, input: FoodCopyInput) => {
    const sourceFood = await getFood({ id: foodId, localeId });
    if (!sourceFood)
      throw new NotFoundError();

    const food = await kyselyDb.foods.contextTransaction(async (transaction) => {
      const food = await transaction.insertInto('foods').values({
        ...pick(sourceFood, ['code', 'localeId', 'englishName', 'name', 'altNames', 'tags', 'icon']),
        ...input,
        simpleName: toSimpleName(input.name),
        version: randomUUID(),
      }).returningAll().executeTakeFirstOrThrow();

      const promises: Promise<any>[] = [
        cache.setAdd('locales-index', food.localeId),
      ];

      if (sourceFood.attributes) {
        promises.push(
          transaction.insertInto('foodAttributes').values({
            ...pick(sourceFood.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']),
            foodId: food.id,
          }).execute(),
        );
      }

      if (sourceFood.parentCategories?.length) {
        let categories: string[] = [];
        if (localeId === input.localeId) {
          categories = sourceFood.parentCategories.map(({ id }) => id);
        }
        else {
          const code = sourceFood.parentCategories.map(({ code }) => code);
          const destLocaleCategories = await transaction
            .selectFrom('categories')
            .select('id')
            .where('code', 'in', code)
            .where('localeId', '=', input.localeId)
            .execute();

          categories = destLocaleCategories.map(({ id }) => id);
        }

        if (categories.length) {
          promises.push(
            transaction.insertInto('foodsCategories')
              .values(categories.map(categoryId => ({ foodId: food.id, categoryId })))
              .execute(),
          );
        }
      }

      if (sourceFood.nutrientRecords?.length) {
        const nutrientRecords = sourceFood.nutrientRecords.map(({ id }) => id);
        promises.push(
          transaction.insertInto('foodsNutrients')
            .values(nutrientRecords.map(nutrientTableRecordId => ({ foodId: food.id, nutrientTableRecordId })))
            .execute(),
        );
      }

      if (sourceFood.associatedFoods?.length) {
        promises.push(transaction
          .insertInto('associatedFoods')
          .values(sourceFood.associatedFoods!.map(psm => ({
            ...pick(psm, [
              'associatedFoodCode',
              'associatedCategoryCode',
              'text',
              'linkAsMain',
              'multiple',
              'genericName',
              'orderBy',
            ]),
            foodId: food.id,
          }))).execute());
      }

      if (sourceFood.portionSizeMethods?.length) {
        promises.push(transaction
          .insertInto('foodPortionSizeMethods')
          .values(
            sourceFood.portionSizeMethods.map(psm => ({
              ...pick(psm, [
                'method',
                'description',
                'pathways',
                'conversionFactor',
                'orderBy',
                'parameters',
              ]),
              foodId: food.id,
            })),
          ).execute(),
        );
      }

      await Promise.all(promises);

      return food;
    });

    return (await getFood({ id: food.id, localeId: food.localeId }))!;
  };

  const deleteFood = async (localeId: string, foodId: string) => {
    const food = await kyselyDb.foods
      .selectFrom('foods')
      .select(['id', 'code'])
      .where('id', '=', foodId)
      .where('localeId', '=', localeId)
      .executeTakeFirst();

    if (!food)
      throw new NotFoundError();

    await Promise.all([
      kyselyDb.foods.contextTransaction(async (transaction) => {
        await transaction.deleteFrom('foods').where('id', '=', foodId).execute();
      }),
      cache.forget(getFoodCacheKeys(localeId, foodId, food.code)),
      cache.setAdd('locales-index', localeId),
    ]);
  };

  const bulkUpdateParentCategories = async (
    transaction: Kysely<FoodsDB>,
    localeId: string,
    affectedRows: BulkFoodInput[],
    idMap: Map<string, string>,
  ) => {
    const parentCodes = new Set<string>();

    for (const item of affectedRows) {
      item.parentCategories?.forEach(parent => parentCodes.add(parent));
    }

    const categoryIdMap = new Map<string, string>();

    if (parentCodes.size > 0) {
      const categories = await transaction.selectFrom('categories')
        .select(['id', 'code'])
        .where('code', 'in', [...parentCodes])
        .where('localeId', '=', localeId)
        .execute();

      for (const category of categories) {
        categoryIdMap.set(category.code, category.id);
      }

      const missing = [...parentCodes].filter(code => !categoryIdMap.has(code));
      if (missing.length) {
        throw new ValidationError(`Invalid category codes: ${missing.join(', ')}`);
      }
    }

    const records: { foodId: string; categoryId: string }[] = [];

    for (const item of affectedRows) {
      if (!item.parentCategories?.length)
        continue;

      const foodId = idMap.get(item.code);
      if (!foodId)
        throw new Error(`Food id missing for code: ${item.code}`);

      for (const parentCode of item.parentCategories) {
        const categoryId = categoryIdMap.get(parentCode);
        if (categoryId)
          records.push({ foodId, categoryId });
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('foodsCategories')
        .where('foodId', 'in', [...idMap.values()])
        .execute();
    }

    if (records.length) {
      await transaction.insertInto('foodsCategories')
        .values(records)
        .execute();
    }
  };

  const bulkUpdateFoodAttributes = async (
    transaction: Kysely<FoodsDB>,
    input: BulkFoodInput[],
    idMap: Map<string, string>,
  ) => {
    const records: any[] = [];

    for (const item of input) {
      if (!item.attributes)
        continue;

      const foodId = idMap.get(item.code);
      if (!foodId)
        throw new Error(`Food id missing for code: ${item.code}`);

      const attrs = pick(item.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);

      if (Object.values(attrs).some(v => v !== null && v !== undefined)) {
        records.push({ foodId, ...attrs });
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('foodAttributes')
        .where('foodId', 'in', [...idMap.values()])
        .execute();
    }

    if (records.length) {
      await transaction.insertInto('foodAttributes')
        .values(records)
        .execute();
    }
  };

  const bulkUpdateAssociatedFoods = async (
    transaction: Kysely<FoodsDB>,
    input: BulkFoodInput[],
    idMap: Map<string, string>,
  ) => {
    const foodCodes = new Set<string>();
    const categoryCodes = new Set<string>();

    for (const item of input) {
      if (!item.associatedFoods?.length)
        continue;

      for (const af of item.associatedFoods) {
        if ((af.associatedFoodCode && af.associatedCategoryCode) || (!af.associatedFoodCode && !af.associatedCategoryCode)) {
          throw new ValidationError(`Food ${item.code}: Associated food must have either food code or category code defined, but not both.`);
        }

        if (af.associatedFoodCode)
          foodCodes.add(af.associatedFoodCode);
        if (af.associatedCategoryCode)
          categoryCodes.add(af.associatedCategoryCode);
      }
    }

    if (foodCodes.size > 0) {
      const existingFoods = await transaction.selectFrom('foods')
        .select('code')
        .where('code', 'in', [...foodCodes])
        .execute();

      const existingFoodCodes = new Set(existingFoods.map(f => f.code));
      const missing = [...foodCodes].filter(code => !existingFoodCodes.has(code));

      if (missing.length) {
        throw new ValidationError(`Invalid associated food codes: ${missing.join(', ')}`);
      }
    }

    if (categoryCodes.size > 0) {
      const existingCategories = await transaction.selectFrom('categories')
        .select('code')
        .where('code', 'in', [...categoryCodes])
        .execute();

      const existingCategoryCodes = new Set(existingCategories.map(c => c.code));
      const missing = [...categoryCodes].filter(code => !existingCategoryCodes.has(code));

      if (missing.length) {
        throw new ValidationError(`Invalid associated category codes: ${missing.join(', ')}`);
      }
    }

    const records: Insertable<FoodsDB['associatedFoods']>[] = [];

    for (const item of input) {
      if (!item.associatedFoods?.length)
        continue;

      const foodId = idMap.get(item.code);
      if (!foodId)
        throw new Error(`Food id missing for code: ${item.code}`);

      for (const af of item.associatedFoods) {
        records.push({
          foodId,
          associatedFoodCode: af.associatedFoodCode,
          associatedCategoryCode: af.associatedCategoryCode,
          text: af.text,
          linkAsMain: af.linkAsMain,
          multiple: af.multiple,
          genericName: af.genericName,
          orderBy: af.orderBy,
        });
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('associatedFoods')
        .where('foodId', 'in', [...idMap.values()])
        .execute();
    }

    if (records.length) {
      await transaction.insertInto('associatedFoods')
        .values(records)
        .execute();
    }
  };

  const bulkUpdateFoodPortionSizeMethods = async (
    transaction: Kysely<FoodsDB>,
    input: BulkFoodInput[],
    idMap: Map<string, string>,
  ) => {
    const records: Insertable<FoodsDB['foodPortionSizeMethods']>[] = [];

    for (const item of input) {
      if (!item.portionSizeMethods?.length)
        continue;

      const foodId = idMap.get(item.code);
      if (!foodId)
        throw new Error(`Food id missing for code: ${item.code}`);

      for (const psm of item.portionSizeMethods) {
        records.push({
          foodId,
          method: psm.method,
          description: psm.description,
          pathways: psm.pathways,
          conversionFactor: psm.conversionFactor,
          orderBy: psm.orderBy,
          parameters: psm.parameters,
        });
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('foodPortionSizeMethods')
        .where('foodId', 'in', [...idMap.values()])
        .execute();
    }

    if (records.length) {
      await transaction.insertInto('foodPortionSizeMethods')
        .values(records)
        .execute();
    }
  };

  const bulkUpdateFoodNutrientRecords = async (
    transaction: Kysely<FoodsDB>,
    input: BulkFoodInput[],
    idMap: Map<string, string>,
  ) => {
    const pairs = new Set<string>(); // "tableId:recordId", just to ensure uniqueness
    const recordsToResolve: { nutrientTableId: string; nutrientTableRecordId: string }[] = [];

    for (const item of input) {
      if (!item.nutrientRecords?.length)
        continue;

      for (const record of item.nutrientRecords) {
        const key = `${record.nutrientTableId}:${record.nutrientTableRecordId}`;
        if (!pairs.has(key)) {
          pairs.add(key);
          recordsToResolve.push({ nutrientTableId: record.nutrientTableId, nutrientTableRecordId: record.nutrientTableRecordId });
        }
      }
    }

    const nutrientRecordIdMap = new Map<string, string>(); // "tableId:recordId" -> internalId

    if (recordsToResolve.length > 0) {
      const rows = await transaction.selectFrom('nutrientTableRecords')
        .select(['id', 'nutrientTableId', 'nutrientTableRecordId'])
        .where(eb => eb.or(
          recordsToResolve.map(r => eb.and([
            eb('nutrientTableId', '=', r.nutrientTableId),
            eb('nutrientTableRecordId', '=', r.nutrientTableRecordId),
          ])),
        ))
        .execute();

      for (const row of rows) {
        nutrientRecordIdMap.set(`${row.nutrientTableId}:${row.nutrientTableRecordId}`, row.id);
      }

      const missing: string[] = [];
      for (const record of recordsToResolve) {
        const key = `${record.nutrientTableId}:${record.nutrientTableRecordId}`;
        if (!nutrientRecordIdMap.has(key)) {
          missing.push(`(${record.nutrientTableId}, ${record.nutrientTableRecordId})`);
        }
      }

      if (missing.length) {
        throw new ValidationError(`Invalid nutrient table references: ${missing.join(', ')}`);
      }
    }

    const records: { foodId: string; nutrientTableRecordId: string }[] = [];

    for (const item of input) {
      if (!item.nutrientRecords?.length)
        continue;

      const foodId = idMap.get(item.code);
      if (!foodId)
        throw new Error(`Food id missing for code: ${item.code}`);

      for (const record of item.nutrientRecords) {
        const key = `${record.nutrientTableId}:${record.nutrientTableRecordId}`;
        const nutrientTableRecordId = nutrientRecordIdMap.get(key)!;
        records.push({ foodId, nutrientTableRecordId });
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('foodsNutrients')
        .where('foodId', 'in', [...idMap.values()])
        .execute();
    }

    if (records.length) {
      await transaction.insertInto('foodsNutrients')
        .values(records)
        .execute();
    }
  };

  const bulkUpdateFoods = async (
    localeId: string,
    input: BulkFoodInput[],
    onConflict: OnConflictOption,
    transaction?: Kysely<FoodsDB>,
  ) => {
    if (input.length === 0)
      return;

    const impl = async (transaction: Kysely<FoodsDB>) => {
      const values = input.map(food => ({
        code: food.code,
        localeId,
        englishName: food.englishName,
        name: food.name,
        simpleName: toSimpleName(food.name),
        altNames: food.altNames,
        tags: food.tags,
        icon: food.icon,
        version: randomUUID(),
      }));

      let rows: { id: string; code: string }[] = [];

      switch (onConflict) {
        case 'overwrite': {
          rows = await transaction
            .insertInto('foods')
            .values(values)
            .onConflict(oc => oc
              .columns(['localeId', 'code'])
              .doUpdateSet({
                englishName: eb => eb.ref('excluded.englishName'),
                name: eb => eb.ref('excluded.name'),
                simpleName: eb => eb.ref('excluded.simpleName'),
                altNames: eb => eb.ref('excluded.altNames'),
                tags: eb => eb.ref('excluded.tags'),
                icon: eb => eb.ref('excluded.icon'),
                version: eb => eb.ref('excluded.version'),
              }),
            )
            .returning(['id', 'code'])
            .execute();
          break;
        }

        case 'skip': {
          rows = await transaction
            .insertInto('foods')
            .values(values)
            .onConflict(oc => oc
              .columns(['localeId', 'code'])
              .doNothing(),
            )
            .returning(['id', 'code'])
            .execute();
          break;
        }

        case 'abort': {
          const codes = input.map(c => c.code);
          const existingFoods = await transaction
            .selectFrom('foods')
            .select(['code'])
            .where('localeId', '=', localeId)
            .where('code', 'in', codes)
            .execute();

          if (existingFoods.length > 0) {
            const conflictingCodes = existingFoods.map(c => c.code);
            throw new ConflictError(`Food codes already exist: ${conflictingCodes.join(', ')}`);
          }

          rows = await transaction
            .insertInto('foods')
            .values(values)
            .returning(['id', 'code'])
            .execute();
          break;
        }
      }

      const idMap = new Map(rows.map(r => [r.code, r.id]));
      const affectedRows = input.filter(i => idMap.has(i.code));

      await bulkUpdateParentCategories(transaction, localeId, affectedRows, idMap);
      await bulkUpdateFoodAttributes(transaction, affectedRows, idMap);
      await bulkUpdateAssociatedFoods(transaction, affectedRows, idMap);
      await bulkUpdateFoodPortionSizeMethods(transaction, affectedRows, idMap);
      await bulkUpdateFoodNutrientRecords(transaction, affectedRows, idMap);

      if (affectedRows.length > 0) {
        await cache.forget(affectedRows.map(i => i.code).flatMap(code => getFoodCacheKeys(localeId, idMap.get(code)!, code)));
        await cache.setAdd('locales-index', localeId);
      }
    };

    if (transaction) {
      await impl(transaction);
    }
    else {
      await kyselyDb.foods.contextTransaction(impl);
    }
  };

  return {
    browseFoods,
    getFood,
    createFood,
    updateFood,
    copyFood,
    deleteFood,
    bulkUpdateFoods,
    bulkUpdateFoodAttributes,
    bulkUpdateParentCategories,
    bulkUpdateFoodPortionSizeMethods,
    bulkUpdateAssociatedFoods,
    bulkUpdateFoodNutrientRecords,
  };
}

export default adminFoodService;

export type AdminFoodService = ReturnType<typeof adminFoodService>;
