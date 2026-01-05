import type { CreationAttributes, Transaction } from 'sequelize';

import { randomUUID } from 'node:crypto';

import { ConflictError, NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type { OpenSearchSyncService } from '@intake24/api/services/foods/opensearch-sync-service';
import { toSimpleName } from '@intake24/api/util';
import type { PortionSizeMethod } from '@intake24/common/surveys';
import type {
  CreateLocalFoodRequest,
  CreateLocalFoodRequestOptions,
} from '@intake24/common/types/http/admin';
import type { AssociatedFood as HttpAssociatedFood } from '@intake24/common/types/http/admin/associated-food';
import {
  AssociatedFood,
  FoodAttribute,
  FoodLocal,
  FoodLocalList,
  FoodNutrient,
  FoodPortionSizeMethod,
  NutrientTableRecord,
} from '@intake24/db';

function localFoodsService({ db, opensearchSyncService }: Pick<IoC, 'db'> & { opensearchSyncService: OpenSearchSyncService }) {
  async function toPortionSizeMethodAttrs(
    foodLocalId: string,
    psm: PortionSizeMethod,
  ): Promise<CreationAttributes<FoodPortionSizeMethod>> {
    return {
      foodLocalId,
      method: psm.method,
      description: psm.description,
      useForRecipes: psm.useForRecipes,
      conversionFactor: psm.conversionFactor,
      orderBy: '1',
      parameters: psm.parameters,
    };
  }

  function toAssociatedFoodAttrs(
    localeId: string,
    foodCode: string,
    index: number,
    httpAssociatedFood: HttpAssociatedFood,
  ): CreationAttributes<AssociatedFood> {
    return {
      foodCode,
      localeId,
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
    localeId: string,
    foodCode: string,
    associatedFoods: HttpAssociatedFood[],
    transaction: Transaction,
  ) {
    const creationAttributes = associatedFoods.map((af, index) => toAssociatedFoodAttrs(localeId, foodCode, index, af));

    await AssociatedFood.destroy({ where: { localeId, foodCode }, transaction });

    await AssociatedFood.bulkCreate(creationAttributes, { transaction });
  }

  async function updatePortionSizeMethodsImpl(
    foodLocalId: string,
    methods: PortionSizeMethod[],
    transaction: Transaction,
  ) {
    const creationAttributes = await Promise.all(
      methods.map(psm => toPortionSizeMethodAttrs(foodLocalId, psm)),
    );

    await FoodPortionSizeMethod.destroy({ where: { foodLocalId }, transaction });

    await FoodPortionSizeMethod.bulkCreate(creationAttributes, { transaction });
  }

  async function updateNutrientMappingImpl(
    foodLocalId: string,
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
      foodLocalId,
      nutrientTableRecordId,
    }));

    await FoodNutrient.destroy({ where: { foodLocalId }, transaction });

    await FoodNutrient.bulkCreate(creationAttributes, { transaction });
  }

  async function updateFoodAttributesImpl(
    foodCode: string,
    attributes: CreateLocalFoodRequest['attributes'],
    transaction: Transaction,
  ): Promise<void> {
    if (!attributes)
      return;

    // Check if any attribute value is defined (not undefined)
    const hasDefinedAttributes
      = attributes.readyMealOption !== undefined
        || attributes.sameAsBeforeOption !== undefined
        || attributes.reasonableAmount !== undefined
        || attributes.useInRecipes !== undefined;

    if (!hasDefinedAttributes)
      return;

    // Find existing attribute record
    const existingAttribute = await FoodAttribute.findOne({
      where: { foodCode },
      transaction,
    });

    if (existingAttribute) {
      // Update existing record
      await existingAttribute.update(
        {
          readyMealOption: attributes.readyMealOption ?? existingAttribute.readyMealOption,
          sameAsBeforeOption: attributes.sameAsBeforeOption ?? existingAttribute.sameAsBeforeOption,
          reasonableAmount: attributes.reasonableAmount ?? existingAttribute.reasonableAmount,
          useInRecipes: attributes.useInRecipes ?? existingAttribute.useInRecipes,
        },
        { transaction },
      );
    }
    else {
      // Create new record
      await FoodAttribute.create(
        {
          foodCode,
          readyMealOption: attributes.readyMealOption ?? null,
          sameAsBeforeOption: attributes.sameAsBeforeOption ?? null,
          reasonableAmount: attributes.reasonableAmount ?? null,
          useInRecipes: attributes.useInRecipes ?? null,
        },
        { transaction },
      );
    }
  }

  async function createImpl(
    localeId: string,
    request: CreateLocalFoodRequest,
    options: CreateLocalFoodRequestOptions,
    transaction: Transaction,
  ): Promise<boolean> {
    let created = false;

    // Postgres invalidates transactions if any query fails (error 25P02, "current transaction is
    // aborted, commands ignored until end of transaction block"), so it is not possible to attempt
    // creating a new record and handle the potential conflict error in the same transaction, and
    // rolling back the transaction would make ensuring atomicity complicated.

    // Manually checking for an existing record is not ideal (database constraints could change and
    // become out of sync with this code) but good enough.

    let instance = await FoodLocal.findOne({
      where: { localeId, foodCode: request.code },
      transaction,
    });

    if (instance !== null) {
      if (options.update) {
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
      instance = await FoodLocal.create(
        {
          localeId,
          foodCode: request.code,
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

    await updatePortionSizeMethodsImpl(instance.id, request.portionSizeMethods, transaction);

    await updateNutrientMappingImpl(instance.id, request.nutrientTableCodes, transaction);

    await updateAssociatedFoodsImpl(localeId, request.code, request.associatedFoods, transaction);

    await updateFoodAttributesImpl(request.code, request.attributes, transaction);

    return created;
  }

  const updatePortionSizeMethods = async (
    foodLocalId: string,
    methods: PortionSizeMethod[],
    transaction?: Transaction,
  ): Promise<void> => {
    if (transaction !== undefined) {
      await updatePortionSizeMethodsImpl(foodLocalId, methods, transaction);
    }
    else {
      await db.foods.transaction(async (t) => {
        await updatePortionSizeMethodsImpl(foodLocalId, methods, t);
      });
    }
  };

  const destroyImpl = async (
    localeId: string,
    foodCode: string,
    transaction: Transaction,
  ): Promise<void> => {
    const foodLocal = await FoodLocal.findOne({
      attributes: ['id', 'foodCode'],
      where: { localeId, foodCode },
      transaction,
    });

    if (foodLocal === null)
      throw new NotFoundError();

    await Promise.all([
      foodLocal.destroy({ transaction }),
      FoodLocalList.destroy({ where: { localeId, foodCode: foodLocal.foodCode }, transaction }),
    ]);
  };

  const create = async (
    localeId: string,
    request: CreateLocalFoodRequest,
    options: CreateLocalFoodRequestOptions,
    transaction?: Transaction,
  ): Promise<boolean> => {
    let result: boolean;

    if (transaction !== undefined) {
      result = await createImpl(localeId, request, options, transaction);
    }
    else {
      result = await db.foods.transaction(async (transaction) => {
        return await createImpl(localeId, request, options, transaction);
      });
    }

    // Sync to OpenSearch after successful database operation
    await opensearchSyncService.syncFood(localeId, request.code);

    return result;
  };

  const destroy = async (localeId: string, foodCode: string, transaction?: Transaction) => {
    if (transaction !== undefined) {
      await destroyImpl(localeId, foodCode, transaction);
    }
    else {
      await db.foods.transaction(async (transaction) => {
        await destroyImpl(localeId, foodCode, transaction);
      });
    }

    // Delete from OpenSearch after successful database operation
    await opensearchSyncService.deleteFood(localeId, foodCode);
  };

  const readImpl = async (
    localeId: string,
    foodCode: string,
    transaction: Transaction,
  ) => {
    const foodLocal = await FoodLocal.findOne({
      where: { localeId, foodCode },
      transaction,
    });

    if (foodLocal === null)
      throw new NotFoundError();

    const portionSizeRows = await FoodPortionSizeMethod.findAll(
      {
        where: { foodLocalId: foodLocal.id },
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
      id: foodLocal.id,
      version: foodLocal.version,
      name: foodLocal.name,
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

  const readEnabledFoods = async (localeId: string): Promise<string[]> => {
    const rows = await FoodLocalList.findAll({ where: { localeId }, attributes: ['foodCode'] });
    return rows.map(row => row.foodCode);
  };

  const updateEnabledFoods = async (localeId: string, enabledFoods: string[]) => {
    return await db.foods.transaction(async (transaction) => {
      await FoodLocalList.destroy({ where: { localeId }, transaction });
      const records = enabledFoods.map(foodCode => ({ localeId, foodCode }));
      await FoodLocalList.bulkCreate(records, { transaction });
    });
  };

  return {
    create,
    read,
    destroy,
    readEnabledFoods,
    updatePortionSizeMethods,
    updateEnabledFoods,
  };
}

export default localFoodsService;

export type LocalFoodsService = ReturnType<typeof localFoodsService>;
