import type { CacheKey } from '../core/redis/cache';
import { randomUUID } from 'node:crypto';
import { pick } from 'lodash';
import { NotFoundError } from '@intake24/api/http/errors';
import { foodsResponse } from '@intake24/api/http/responses/admin';
import type { IoC } from '@intake24/api/ioc';
import { toSimpleName } from '@intake24/api/util';
import type { FoodCopyInput, FoodInput } from '@intake24/common/types/http/admin';
import type { FindOptions, FoodAttributes, PaginateQuery, Transaction } from '@intake24/db';
import { AssociatedFood, Category, Food, FoodAttribute, FoodPortionSizeMethod, Op } from '@intake24/db';

function adminFoodService({ cache, db }: Pick<IoC, 'cache' | 'db'>) {
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
        cache.push('indexing-locales', localeId),
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
        cache.push('indexing-locales', localeId),
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
        cache.push('indexing-locales', food.localeId),
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
                  'useForRecipes',
                  'conversionFactor',
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
      cache.push('indexing-locales', localeId),
    ]);
  };

  return {
    browseFoods,
    getFood,
    createFood,
    updateFood,
    copyFood,
    deleteFood,
  };
}

export default adminFoodService;

export type AdminFoodService = ReturnType<typeof adminFoodService>;
