import type { CacheKey } from '../core/redis/cache';

import { randomUUID } from 'node:crypto';

import { pick } from 'lodash';
import { NotFoundError } from '@intake24/api/http/errors';
import { foodsResponse } from '@intake24/api/http/responses/admin';
import type { IoC } from '@intake24/api/ioc';
import { toSimpleName } from '@intake24/api/util';
import type {
  FoodInput,
  FoodLocalCopyInput,
  FoodLocalCopySource,
  FoodLocalInput,
} from '@intake24/common/types/http/admin';
import type { FindOptions, FoodLocalAttributes, PaginateQuery, Transaction } from '@intake24/db';
import {
  AssociatedFood,
  Food,
  FoodAttribute,
  FoodLocal,
  FoodLocalList,
  FoodPortionSizeMethod,
  Op,
  SystemLocale,
} from '@intake24/db';

function adminFoodService({ cache, db }: Pick<IoC, 'cache' | 'db'>) {
  const browseFoods = async (localeId: string, query: PaginateQuery) => {
    const options: FindOptions<FoodLocalAttributes> = {
      where: { localeId },
      include: [{ association: 'main', required: true }],
    };
    const { search } = query;

    if (search) {
      const op
        = FoodLocal.sequelize?.getDialect() === 'postgres'
          ? { [Op.iLike]: `%${search}%` }
          : { [Op.substring]: search };

      const ops = ['foodCode', 'name', '$main.name$'].map(column => ({ [column]: op }));

      options.where = { ...options.where, [Op.or]: ops };
    }

    return FoodLocal.paginate({ query, transform: foodsResponse, ...options });
  };

  const getFoodImpl = async (foodId: { id: string } | { foodCode: string }, localeCode: string) => {
    const where = { localeId: localeCode };

    return FoodLocal.findOne({
      where: { ...where, ...foodId },
      include: [
        {
          association: 'main',
          required: true,
          include: [
            { association: 'attributes' },
            { association: 'brands', where, required: false, separate: true },
            { association: 'foodGroup' },
            { association: 'locales', through: { attributes: [] } },
            {
              association: 'parentCategories',
              through: { attributes: [] },
              include: [{ association: 'locals', attributes: ['id', 'name'], where }],
            },
          ],
        },
        {
          association: 'associatedFoods',
          required: false,
          separate: true,
          where,
          include: [{ association: 'associatedCategory' }, { association: 'associatedFood' }],
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

  const getFoodByCode = async (foodCode: string, localeCode: string) => getFoodImpl({ foodCode }, localeCode);

  const getFood = async (foodLocalId: string, localeCode: string) => getFoodImpl({ id: foodLocalId }, localeCode);

  const updatePortionSizeMethods = async (
    foodLocalId: string,
    methods: FoodPortionSizeMethod[],
    inputs: FoodLocalInput['portionSizeMethods'],
    { transaction }: { transaction: Transaction },
  ) => {
    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await FoodPortionSizeMethod.destroy({
      where: { foodLocalId, id: { [Op.notIn]: ids } },
      transaction,
    });

    if (!inputs.length)
      return [];

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

      const newMethod = await FoodPortionSizeMethod.create(
        { ...rest, foodLocalId },
        { transaction },
      );
      newMethods.push(newMethod);
    }

    return [...methods, ...newMethods];
  };

  const updateAssociatedFoods = async (
    foodCode: string,
    localeId: string,
    foods: AssociatedFood[],
    inputs: FoodLocalInput['associatedFoods'],
    { transaction }: { transaction: Transaction },
  ) => {
    const ids = inputs.map(({ id }) => id).filter(Boolean) as string[];

    await AssociatedFood.destroy({
      where: { foodCode, localeId, id: { [Op.notIn]: ids } },
      transaction,
    });

    if (!inputs.length)
      return [];

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

      const newFood = await AssociatedFood.create({ ...rest, foodCode, localeId }, { transaction });
      newFoods.push(newFood);
    }

    return [...foods, ...newFoods];
  };

  const createFood = async (localeCode: string, input: FoodInput) => {
    const foodLocal = await db.foods.transaction(async (transaction) => {
      let main = await Food.findByPk(input.code, { transaction });
      if (!main) {
        main = await Food.create({ ...input, version: randomUUID() }, { transaction });

        if (input.parentCategories?.length) {
          const categories = input.parentCategories.map(({ code }) => code);
          await main.$set('parentCategories', categories, { transaction });
        }
      }

      const [foodLocal] = await Promise.all([
        FoodLocal.create(
          {
            foodCode: main.code,
            localeId: localeCode,
            name: main.name,
            simpleName: toSimpleName(main.name),
            version: randomUUID(),
          },
          { transaction },
        ),
        main.$add('locales', localeCode, { transaction }),
      ]);

      return foodLocal;
    });

    await cache.push('indexing-locales', localeCode);

    return (await getFood(foodLocal.id, localeCode))!;
  };

  const updateFood = async (foodLocalId: string, localeCode: string, input: FoodLocalInput) => {
    const foodLocal = await getFood(foodLocalId, localeCode);
    if (!foodLocal)
      throw new NotFoundError();

    const { main, portionSizeMethods, associatedFoods } = foodLocal;
    if (!main || !associatedFoods || !portionSizeMethods)
      throw new NotFoundError();

    const foodCacheKeys: CacheKey[] = [
      `food-attributes:${main.code}`,
      `food-entry:${localeCode}:${main.code}`,
      `food-all-categories:${main.code}`,
      `food-parent-categories:${main.code}`,
    ];

    await db.foods.transaction(async (transaction) => {
      const nutrientRecords = input.nutrientRecords.map(({ id }) => id);

      const promises: Promise<any>[] = [
        foodLocal.update(pick(input, ['name', 'altNames', 'tags']), { transaction }),
        foodLocal.$set('nutrientRecords', nutrientRecords, { transaction }),
        updatePortionSizeMethods(foodLocalId, portionSizeMethods, input.portionSizeMethods, {
          transaction,
        }),
        updateAssociatedFoods(main.code, localeCode, associatedFoods, input.associatedFoods, {
          transaction,
        }),
      ];

      if (input.main) {
        promises.push(main.update(pick(input.main, ['name', 'foodGroupId']), { transaction }));

        if (input.main.locales) {
          const locales = input.main.locales.map(({ id }) => id);
          promises.push(main.$set('locales', locales, { transaction }));
        }
        if (input.main.parentCategories) {
          const categories = input.main.parentCategories.map(({ code }) => code);
          promises.push(main.$set('parentCategories', categories, { transaction }));
        }

        if (input.main.attributes) {
          const attributesInput = pick(input.main.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']);
          if (Object.values(attributesInput).every(item => item === null)) {
            if (main.attributes)
              promises.push(main.attributes.destroy({ transaction }));
          }
          else {
            promises.push(
              main.attributes
                ? main.attributes.update(attributesInput, { transaction })
                : FoodAttribute.create({ foodCode: main.code, ...attributesInput }, { transaction }),
            );
          }
        }
      }

      await Promise.all(promises);

      if (input.main?.code && input.main.code !== main.code) {
        await Food.update({ code: input.main.code }, { where: { code: main.code }, transaction });
        foodCacheKeys.push(
          `food-attributes:${input.main.code}`,
          `food-entry:${localeCode}:${input.main.code}`,
          `food-all-categories:${input.main.code}`,
          `food-parent-categories:${input.main.code}`,
        );
      }
    });

    await Promise.all([
      cache.forget(foodCacheKeys),
      cache.push('indexing-locales', localeCode),
    ]);

    return (await getFood(foodLocalId, localeCode))!;
  };

  const copyFood = async (source: FoodLocalCopySource, input: FoodLocalCopyInput) => {
    const sourceFoodLocal = await getFood(source.foodId, source.localeCode);
    if (!sourceFoodLocal)
      throw new NotFoundError();

    let localeCode = sourceFoodLocal.localeId;
    if (source.localeId !== input.localeId) {
      const targetLocale = await SystemLocale.findByPk(input.localeId, { attributes: ['code'] });
      if (!targetLocale)
        throw new NotFoundError();

      localeCode = targetLocale.code;
    }

    const foodLocal = await db.foods.transaction(async (transaction) => {
      const [food, created] = await Food.findOrCreate(
        {
          where: { code: input.code },
          defaults: {
            code: input.code,
            name: input.name,
            foodGroupId: sourceFoodLocal.main!.foodGroupId,
            version: randomUUID(),
          },
          transaction,
        },
      );

      const foodLocal = await FoodLocal.create(
        {
          foodCode: input.code,
          localeId: localeCode,
          name: input.name,
          simpleName: toSimpleName(input.name),
          altNames: sourceFoodLocal.altNames,
          tags: sourceFoodLocal.tags,
          version: randomUUID(),
        },
        { transaction },
      );

      const promises: Promise<any>[] = [];

      promises.push(food.$add('locales', localeCode, { transaction }));

      if (created) {
        if (sourceFoodLocal.main?.attributes) {
          promises.push(
            FoodAttribute.create(
              {
                ...pick(sourceFoodLocal.main.attributes, ['sameAsBeforeOption', 'readyMealOption', 'reasonableAmount', 'useInRecipes']),
                foodCode: input.code,
              },
              { transaction },
            ),
          );
        }

        if (sourceFoodLocal.main?.parentCategories?.length) {
          const categories = sourceFoodLocal.main.parentCategories.map(({ code }) => code);
          promises.push(food.$set('parentCategories', categories, { transaction }));
        }
      }

      if (sourceFoodLocal.nutrientRecords?.length) {
        const nutrientRecords = sourceFoodLocal.nutrientRecords.map(({ id }) => id);
        promises.push(foodLocal.$set('nutrientRecords', nutrientRecords, { transaction }));
      }

      if (sourceFoodLocal.associatedFoods?.length) {
        const associatedFoods = sourceFoodLocal.associatedFoods!.map(psm => ({
          ...pick(psm, [
            'associatedFoodCode',
            'associatedCategoryCode',
            'text',
            'linkAsMain',
            'multiple',
            'genericName',
            'orderBy',
          ]),
          foodCode: foodLocal.foodCode,
          localeId: foodLocal.localeId,
        }));
        promises.push(AssociatedFood.bulkCreate(associatedFoods, { transaction }));
      }

      if (sourceFoodLocal.portionSizeMethods?.length) {
        promises.push(
          ...sourceFoodLocal.portionSizeMethods.map(psm =>
            FoodPortionSizeMethod.create(
              {
                ...pick(psm, [
                  'method',
                  'description',
                  'useForRecipes',
                  'conversionFactor',
                  'orderBy',
                  'parameters',
                ]),
                foodLocalId: foodLocal.id,
              },
              { transaction },
            ),
          ),
        );
      }

      await Promise.all(promises);

      return foodLocal;
    });

    await cache.push('indexing-locales', localeCode);

    return (await getFood(foodLocal.id, foodLocal.localeId))!;
  };

  const deleteFood = async (foodLocalId: string, localeCode: string) => {
    const foodLocal = await FoodLocal.findOne({
      attributes: ['id', 'foodCode'],
      where: { id: foodLocalId, localeId: localeCode },
    });
    if (!foodLocal)
      throw new NotFoundError();

    await Promise.all([
      foodLocal.destroy(),
      FoodLocalList.destroy({ where: { foodCode: foodLocal.foodCode, localeId: localeCode } }),
    ]);
  };

  return {
    browseFoods,
    getFood,
    getFoodByCode,
    createFood,
    updateFood,
    copyFood,
    deleteFood,
  };
}

export default adminFoodService;

export type AdminFoodService = ReturnType<typeof adminFoodService>;
