import type { Kysely } from 'kysely';

import type { CacheKey } from '../core/redis/cache';
import type { IoC } from '@intake24/api/ioc';
import type { BulkFoodInput, FoodCopyInput, FoodInput } from '@intake24/common/types/http/admin';
import type { FindOptions, FoodAttributes, FoodsDB, OnConflictOption, PaginateQuery, Transaction } from '@intake24/db';

import { randomUUID } from 'node:crypto';

import { pick } from 'lodash-es';

import { ConflictError, NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { foodsResponse } from '@intake24/api/http/responses/admin';
import { toSimpleName } from '@intake24/api/util';
import { AssociatedFood, Category, Food, FoodAttribute, FoodPortionSizeMethod, Op } from '@intake24/db';

function adminFoodService({ cache, db, kyselyDb }: Pick<IoC, 'cache' | 'db' | 'kyselyDb'>) {
  function getFoodCacheKeys(localeId: string, foodId: string, foodCode: string): CacheKey[] {
    return [
      `food-attributes:${foodId}`,
      `food-entry:${foodId}`,
      `food-entry:${localeId}:${foodCode}`,
      `food-all-categories:${foodId}`,
      `food-all-category-codes:${foodId}`,
      `food-parent-categories:${foodId}`,
    ];
  }

  const browseFoods = async (localeId: string, query: PaginateQuery) => {
    const options: FindOptions<FoodAttributes> = { where: { localeId } };
    const { search } = query;

    if (search) {
      const op
        = Food.sequelize?.getDialect() === 'postgres'
          ? { [Op.iLike]: `%${search}%` }
          : { [Op.substring]: search };

      const ops = ['code', 'englishName', 'name'].map(column => ({ [column]: op }));

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
    { transaction }: { transaction: Transaction },
  ): Promise<void> => {
    if (!inputs)
      return;

    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await FoodPortionSizeMethod.destroy({ where: { foodId, id: { [Op.notIn]: ids } }, transaction });

    if (!inputs.length)
      return;

    const newMethods: FoodPortionSizeMethod[] = [];

    for (const input of inputs) {
      const { id, ...rest } = input;

      if (id) {
        const match = methods.find(method => method.id === id);
        if (match) {
          await match.update(rest, { transaction });
          continue;
        }
      }

      const newMethod = await FoodPortionSizeMethod.create({ ...rest, foodId }, { transaction });
      newMethods.push(newMethod);
    }
  };

  const updateAssociatedFoods = async (
    foodId: string,
    foods: AssociatedFood[],
    inputs: FoodInput['associatedFoods'],
    { transaction }: { transaction: Transaction },
  ): Promise<void> => {
    if (!inputs)
      return;

    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await AssociatedFood.destroy({ where: { foodId, id: { [Op.notIn]: ids } }, transaction });

    if (!inputs.length)
      return;

    const newFoods: AssociatedFood[] = [];

    for (const input of inputs) {
      const { id, ...rest } = input;

      if (id) {
        const match = foods.find(food => food.id === id);
        if (match) {
          await match.update(rest, { transaction });
          continue;
        }
      }

      const newFood = await AssociatedFood.create({ ...rest, foodId }, { transaction });
      newFoods.push(newFood);
    }
  };

  const createFood = async (localeId: string, input: FoodInput) => {
    const food = await db.foods.transaction(async (transaction) => {
      const food = await Food.create(
        {
          code: input.code,
          localeId,
          englishName: input.englishName,
          name: input.name,
          simpleName: toSimpleName(input.name),
          altNames: input.altNames,
          tags: input.tags,
          version: randomUUID(),
        },
        { transaction },
      );

      const promises: Promise<any>[] = [
        cache.setAdd('locales-index', localeId),
        updatePortionSizeMethods(food.id, [], input.portionSizeMethods, { transaction }),
        updateAssociatedFoods(food.id, [], input.associatedFoods, { transaction }),
      ];

      if (input.parentCategories?.length) {
        const categories = input.parentCategories.map(({ id }) => id);
        promises.push(food.$add('parentCategories', categories, { transaction }));
      }

      if (input.attributes) {
        const attributesInput = pick(input.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);
        if (Object.values(attributesInput).some(item => item !== null)) {
          promises.push(FoodAttribute.create({ foodId: food.id, ...attributesInput }, { transaction }));
        }
      }

      if (input.nutrientRecords?.length) {
        const nutrientRecords = input.nutrientRecords.map(({ id }) => id);
        promises.push(food.$set('nutrientRecords', nutrientRecords, { transaction }));
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

    const { associatedFoods, attributes, portionSizeMethods } = food;
    if (!associatedFoods || !portionSizeMethods)
      throw new NotFoundError();

    await db.foods.transaction(async (transaction) => {
      const promises: Promise<any>[] = [
        cache.forget(getFoodCacheKeys(localeId, foodId, food.code)),
        cache.setAdd('locales-index', localeId),
        food.update({
          ...pick(input, ['code', 'englishName', 'name', 'altNames', 'tags']),
          simpleName: toSimpleName(input.name),
          version: randomUUID(),
        }, { transaction }),
        updatePortionSizeMethods(foodId, portionSizeMethods, input.portionSizeMethods, { transaction }),
        updateAssociatedFoods(foodId, associatedFoods, input.associatedFoods, { transaction }),
      ];

      if (input.parentCategories) {
        const categories = input.parentCategories.map(({ id }) => id);
        promises.push(food.$set('parentCategories', categories, { transaction }));
      }

      if (input.attributes) {
        const attributesInput = pick(input.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);
        if (Object.values(attributesInput).every(item => item === null)) {
          if (attributes)
            promises.push(attributes.destroy({ transaction }));
        }
        else {
          promises.push(
            attributes
              ? attributes.update(attributesInput, { transaction })
              : FoodAttribute.create({ foodId, ...attributesInput }, { transaction }),
          );
        }
      }

      if (input.nutrientRecords) {
        const nutrientRecords = input.nutrientRecords.map(({ id }) => id);
        promises.push(food.$set('nutrientRecords', nutrientRecords, { transaction }));
      }

      await Promise.all(promises);
    });

    return (await getFood({ id: foodId, localeId }))!;
  };

  const copyFood = async (localeId: string, foodId: string, input: FoodCopyInput) => {
    const sourceFood = await getFood({ id: foodId, localeId });
    if (!sourceFood)
      throw new NotFoundError();

    const food = await db.foods.transaction(async (transaction) => {
      const food = await Food.create(
        {
          ...pick(sourceFood, ['code', 'localeId', 'englishName', 'name', 'simpleName', 'altNames', 'tags']),
          ...input,
          simpleName: toSimpleName(input.name)!,
          version: randomUUID(),
        },
        { transaction },
      );

      const promises: Promise<any>[] = [
        cache.setAdd('locales-index', food.localeId),
      ];

      if (sourceFood.attributes) {
        promises.push(
          FoodAttribute.create(
            {
              ...pick(sourceFood.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']),
              foodId: food.id,
            },
            { transaction },
          ),
        );
      }

      if (sourceFood.parentCategories?.length) {
        let categories: string[] = [];
        if (localeId === input.localeId) {
          categories = sourceFood.parentCategories.map(({ id }) => id);
        }
        else {
          const code = sourceFood.parentCategories.map(({ code }) => code);
          const destLocaleCategories = await Category.findAll({
            attributes: ['id'],
            where: { code, localeId: input.localeId },
            transaction,
          });

          categories = destLocaleCategories.map(({ id }) => id);
        }

        if (categories.length)
          promises.push(food.$set('parentCategories', categories, { transaction }));
      }

      if (sourceFood.nutrientRecords?.length) {
        const nutrientRecords = sourceFood.nutrientRecords.map(({ id }) => id);
        promises.push(food.$set('nutrientRecords', nutrientRecords, { transaction }));
      }

      if (sourceFood.associatedFoods?.length) {
        const associatedFoods = sourceFood.associatedFoods!.map(psm => ({
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
        }));
        promises.push(AssociatedFood.bulkCreate(associatedFoods, { transaction }));
      }

      if (sourceFood.portionSizeMethods?.length) {
        promises.push(
          ...sourceFood.portionSizeMethods.map(psm =>
            FoodPortionSizeMethod.create(
              {
                ...pick(psm, [
                  'method',
                  'description',
                  'pathways',
                  'conversionFactor',
                  'defaultWeight',
                  'orderBy',
                  'parameters',
                ]),
                foodId: food.id,
              },
              { transaction },
            ),
          ),
        );
      }

      await Promise.all(promises);

      return food;
    });

    return (await getFood({ id: food.id, localeId: food.localeId }))!;
  };

  const deleteFood = async (localeId: string, foodId: string) => {
    const food = await Food.findOne({ attributes: ['id', 'code'], where: { id: foodId, localeId } });
    if (!food)
      throw new NotFoundError();

    await Promise.all([
      food.destroy(),
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
        .where('code', 'in', Array.from(parentCodes))
        .where('localeId', '=', localeId)
        .execute();

      for (const category of categories) {
        categoryIdMap.set(category.code, category.id);
      }

      const missing = Array.from(parentCodes).filter(code => !categoryIdMap.has(code));
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
        .where('foodId', 'in', Array.from(idMap.values()))
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
        .where('foodId', 'in', Array.from(idMap.values()))
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
        .where('code', 'in', Array.from(foodCodes))
        .execute();

      const existingFoodCodes = new Set(existingFoods.map(f => f.code));
      const missing = Array.from(foodCodes).filter(code => !existingFoodCodes.has(code));

      if (missing.length) {
        throw new ValidationError(`Invalid associated food codes: ${missing.join(', ')}`);
      }
    }

    if (categoryCodes.size > 0) {
      const existingCategories = await transaction.selectFrom('categories')
        .select('code')
        .where('code', 'in', Array.from(categoryCodes))
        .execute();

      const existingCategoryCodes = new Set(existingCategories.map(c => c.code));
      const missing = Array.from(categoryCodes).filter(code => !existingCategoryCodes.has(code));

      if (missing.length) {
        throw new ValidationError(`Invalid associated category codes: ${missing.join(', ')}`);
      }
    }

    const records: any[] = [];

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
        .where('foodId', 'in', Array.from(idMap.values()))
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
    const records: any[] = [];

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
          useForRecipes: psm.useForRecipes,
          conversionFactor: psm.conversionFactor,
          orderBy: psm.orderBy,
          parameters: psm.parameters,
        });
      }
    }

    if (idMap.size > 0) {
      await transaction.deleteFrom('foodPortionSizeMethods')
        .where('foodId', 'in', Array.from(idMap.values()))
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
        .where('foodId', 'in', Array.from(idMap.values()))
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
        altNames: JSON.stringify(food.altNames),
        tags: JSON.stringify(food.tags ?? []),
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
      await kyselyDb.foods.transaction().execute(impl);
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
