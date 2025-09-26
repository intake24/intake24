import type { CreationAttributes, Transaction } from 'sequelize';

import { randomUUID } from 'node:crypto';

import { ConflictError, NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { toSimpleName } from '@intake24/api/util';
import type { PortionSizeMethod } from '@intake24/common/surveys';
import type {
  CreateFoodRequest,
  CreateFoodRequestOptions,
} from '@intake24/common/types/http/admin';
import type { AssociatedFood as HttpAssociatedFood } from '@intake24/common/types/http/admin/associated-food';
import {
  AssociatedFood,
  Food,
  FoodAttribute,
  FoodNutrient,
  FoodPortionSizeMethod,
  NutrientTableRecord,
} from '@intake24/db';

function localFoodsService({ db }: Pick<IoC, 'db'>) {
  async function toPortionSizeMethodAttrs(
    foodId: string,
    psm: PortionSizeMethod,
  ): Promise<CreationAttributes<FoodPortionSizeMethod>> {
    return {
      foodId,
      method: psm.method,
      description: psm.description,
      useForRecipes: psm.useForRecipes,
      conversionFactor: psm.conversionFactor,
      orderBy: '1',
      parameters: psm.parameters,
    };
  }

  function toAssociatedFoodAttrs(
    foodId: string,
    index: number,
    httpAssociatedFood: HttpAssociatedFood,
  ): CreationAttributes<AssociatedFood> {
    return {
      foodId,
      associatedFoodCode: httpAssociatedFood.foodCode,
      associatedCategoryCode: httpAssociatedFood.categoryCode,
      text: httpAssociatedFood.promptText,
      genericName: httpAssociatedFood.genericName,
      linkAsMain: httpAssociatedFood.linkAsMain,
      multiple: httpAssociatedFood.allowMultiple,
      orderBy: index.toString(),
    };
  }

  async function updateAssociatedFoodsImpl(
    foodId: string,
    associatedFoods: HttpAssociatedFood[],
    transaction: Transaction,
  ) {
    const creationAttributes = associatedFoods.map((af, index) => toAssociatedFoodAttrs(foodId, index, af));

    await AssociatedFood.destroy({ where: { foodId }, transaction });

    await AssociatedFood.bulkCreate(creationAttributes, { transaction });
  }

  async function updatePortionSizeMethodsImpl(
    foodId: string,
    methods: PortionSizeMethod[],
    transaction: Transaction,
  ) {
    const creationAttributes = await Promise.all(
      methods.map(psm => toPortionSizeMethodAttrs(foodId, psm)),
    );

    await FoodPortionSizeMethod.destroy({ where: { foodId }, transaction });

    await FoodPortionSizeMethod.bulkCreate(creationAttributes, { transaction });
  }

  async function updateNutrientMappingImpl(
    foodId: string,
    nutrientTableReferences: Record<string, string>,
    transaction: Transaction,
  ) {
    const tableIds = new Set<string>();
    const recordIds = new Set<string>();

    Object.entries(nutrientTableReferences).forEach(([tableId, recordId]) => {
      tableIds.add(tableId);
      recordIds.add(recordId);
    });

    const nutrientTableRecords = await NutrientTableRecord.findAll({
      where: {
        nutrientTableId: [...tableIds],
        nutrientTableRecordId: [...recordIds],
      },
      transaction,
    });

    const nutrientTableRecordIds: string[] = [];

    Object.entries(nutrientTableReferences).forEach(([nutrientTableId, nutrientTableRecordId]) => {
      const record = nutrientTableRecords.find(
        record =>
          record.nutrientTableId === nutrientTableId
          && record.nutrientTableRecordId === nutrientTableRecordId,
      );

      if (record === undefined) {
        throw new Error(
          `Could not find food nutrient table record: ${nutrientTableId}/${nutrientTableRecordId}`,
        );
      }

      nutrientTableRecordIds.push(record.id);
    });

    const creationAttributes = nutrientTableRecordIds.map(nutrientTableRecordId => ({
      foodId,
      nutrientTableRecordId,
    }));

    await FoodNutrient.destroy({ where: { foodId }, transaction });

    await FoodNutrient.bulkCreate(creationAttributes, { transaction });
  }

  async function createImpl(
    localeId: string,
    request: CreateFoodRequest,
    options: CreateFoodRequestOptions,
    transaction: Transaction,
  ): Promise<boolean> {
    let created = false;

    // Postgres invalidates transactions if any query fails (error 25P02, "current transaction is
    // aborted, commands ignored until end of transaction block"), so it is not possible to attempt
    // creating a new record and handle the potential conflict error in the same transaction, and
    // rolling back the transaction would make ensuring atomicity complicated.

    // Manually checking for an existing record is not ideal (database constraints could change and
    // become out of sync with this code) but good enough.

    let instance = await Food.findOne({ where: { localeId, code: request.code }, transaction });

    if (instance !== null) {
      if (options.update) {
        instance.englishName = request.englishName;
        instance.name = request.name;
        instance.simpleName = toSimpleName(request.name);
        instance.altNames = request.altNames ?? {};
        instance.tags = request.tags ?? [];
        instance.version = randomUUID();

        await instance.save({ transaction });
      }
      else {
        throw new ConflictError(
          `A record already exists for ${request.code} in locale ${localeId}`,
        );
      }
    }
    else {
      instance = await Food.create(
        {
          localeId,
          code: request.code,
          englishName: request.englishName,
          name: request.name,
          altNames: request.altNames,
          tags: request.tags,
          version: randomUUID(),
          simpleName: toSimpleName(request.name),
        },
        { transaction },
      );

      created = true;
    }

    await Promise.all([
      updatePortionSizeMethodsImpl(instance.id, request.portionSizeMethods, transaction),
      updateNutrientMappingImpl(instance.id, request.nutrientTableCodes, transaction),
      updateAssociatedFoodsImpl(instance.id, request.associatedFoods, transaction),
      request.parentCategories ? instance.$set('parentCategories', request.parentCategories, { transaction }) : null,
    ].filter(Boolean));

    // Should be an upsert, but the Sequelize implementation is weird
    await FoodAttribute.destroy({ where: { foodId: instance.id }, transaction });
    await FoodAttribute.create({ ...request.attributes, foodId: instance.id }, { transaction });

    return created;
  }

  const updatePortionSizeMethods = async (
    foodId: string,
    methods: PortionSizeMethod[],
    transaction?: Transaction,
  ): Promise<void> => {
    if (transaction !== undefined) {
      await updatePortionSizeMethodsImpl(foodId, methods, transaction);
    }
    else {
      await db.foods.transaction(async (t) => {
        await updatePortionSizeMethodsImpl(foodId, methods, t);
      });
    }
  };

  const create = async (
    localeId: string,
    request: CreateFoodRequest,
    options: CreateFoodRequestOptions,
    transaction?: Transaction,
  ): Promise<boolean> => {
    if (transaction !== undefined) {
      return await createImpl(localeId, request, options, transaction);
    }
    else {
      return await db.foods.transaction(async (transaction) => {
        return await createImpl(localeId, request, options, transaction);
      });
    }
  };

  const readImpl = async (
    localeId: string,
    foodCode: string,
    transaction: Transaction,
  ) => {
    const food = await Food.findOne({ where: { localeId, code: foodCode }, transaction });

    if (food === null)
      throw new NotFoundError();

    const portionSizeRows = await FoodPortionSizeMethod.findAll(
      {
        where: { foodId: food.id },
        attributes: ['method', 'description', 'useForRecipes', 'conversionFactor', 'orderBy', 'parameters'],
        transaction,
      },
    );

    const portionSizeMethods: PortionSizeMethod[] = portionSizeRows.map(row => (
      {
        method: row.method,
        conversionFactor: row.conversionFactor,
        description: row.description,
        useForRecipes: row.useForRecipes,
        orderBy: row.orderBy,
        parameters: row.parameters,
      } as PortionSizeMethod));

    return {
      foodCode,
      localeId,
      id: food.id,
      version: food.version,
      name: food.name,
      portionSizeMethods,
    };
  };

  const read = async (localeId: string, foodCode: string, transaction?: Transaction) => {
    if (transaction !== undefined) {
      return await readImpl(localeId, foodCode, transaction);
    }
    else {
      return await db.foods.transaction(async (transaction) => {
        return await readImpl(localeId, foodCode, transaction);
      });
    }
  };

  const getFoodCodes = async (localeId: string): Promise<string[]> => {
    const rows = await Food.findAll({ where: { localeId }, attributes: ['code'] });
    return rows.map(row => row.code);
  };

  return {
    create,
    read,
    getFoodCodes,
    updatePortionSizeMethods,
  };
}

export default localFoodsService;

export type LocalFoodsService = ReturnType<typeof localFoodsService>;
