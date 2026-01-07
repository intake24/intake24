import { randomUUID } from 'node:crypto';

import type { IoC } from '@intake24/api/ioc';
import type {
  CreateGlobalFoodRequest,
  FoodEntry,
  UpdateGlobalFoodRequest,
} from '@intake24/common/types/http/admin';
import { Category, Food, FoodAttribute, FoodCategory, FoodLocal } from '@intake24/db';

function globalFoodsService({ db, opensearchSyncService }: Pick<IoC, 'db' | 'opensearchSyncService'>) {
  /**
   * Sync food to OpenSearch for all locales it belongs to.
   * This ensures that when global food attributes change (ready_meal_option, etc.),
   * the OpenSearch index is updated for Japanese locale search.
   */
  const syncFoodToAllLocales = async (foodCode: string): Promise<void> => {
    const locales = await FoodLocal.findAll({
      where: { foodCode },
      attributes: ['localeId'],
    });

    // Sync to each locale (opensearchSyncService will skip non-Japanese locales)
    await Promise.all(
      locales.map(locale => opensearchSyncService.syncFood(locale.localeId, foodCode)),
    );
  };

  const create = async (input: CreateGlobalFoodRequest): Promise<FoodEntry> => {
    const result = await db.foods.transaction(async (t) => {
      // Extract attributes from input - these go in separate FoodAttribute table
      const { attributes, ...foodInput } = input;

      const food = await Food.create(
        {
          version: randomUUID(),
          ...foodInput,
        },
        { transaction: t },
      );

      // Create FoodAttribute entry if any attributes are defined
      const hasDefinedAttributes
        = attributes.readyMealOption !== undefined
          || attributes.sameAsBeforeOption !== undefined
          || attributes.reasonableAmount !== undefined
          || attributes.useInRecipes !== undefined;

      if (hasDefinedAttributes) {
        await FoodAttribute.create(
          {
            foodCode: food.code,
            readyMealOption: attributes.readyMealOption ?? null,
            sameAsBeforeOption: attributes.sameAsBeforeOption ?? null,
            reasonableAmount: attributes.reasonableAmount ?? null,
            useInRecipes: attributes.useInRecipes ?? null,
          },
          { transaction: t },
        );
      }

      // Create parent category associations
      if (input.parentCategories?.length) {
        const categoryEntries = input.parentCategories.map(categoryCode => ({
          foodCode: food.code,
          categoryCode,
        }));
        await FoodCategory.bulkCreate(categoryEntries, { transaction: t });
      }

      // Return the created food with its associations
      return (await Food.findOne({
        where: { code: food.code },
        include: [FoodAttribute, Category],
        transaction: t,
      }))!;
    });

    // Sync to OpenSearch for all locales (after transaction commits)
    await syncFoodToAllLocales(result.code);

    return result;
  };

  const update = async (
    globalFoodId: string,
    version: string,
    input: UpdateGlobalFoodRequest,
  ): Promise<FoodEntry | null> => {
    const result = await db.foods.transaction(async (t) => {
      const affectedRows = await Food.update(
        {
          name: input.name,
          foodGroupId: input.foodGroupId,
          version: randomUUID(),
        },
        { where: { code: globalFoodId, version }, transaction: t },
      );

      // Record with matching food code/version does not exist
      if (affectedRows[0] !== 1)
        return null;

      // Record exists, upsert attributes
      const existingAttribute = await FoodAttribute.findOne({
        where: { foodCode: globalFoodId },
        transaction: t,
      });

      if (existingAttribute) {
        await existingAttribute.update(input.attributes, { transaction: t });
      }
      else {
        // Create new attribute record if any values are defined
        const hasDefinedAttributes
          = input.attributes.readyMealOption !== undefined
            || input.attributes.sameAsBeforeOption !== undefined
            || input.attributes.reasonableAmount !== undefined
            || input.attributes.useInRecipes !== undefined;

        if (hasDefinedAttributes) {
          await FoodAttribute.create(
            {
              foodCode: globalFoodId,
              readyMealOption: input.attributes.readyMealOption ?? null,
              sameAsBeforeOption: input.attributes.sameAsBeforeOption ?? null,
              reasonableAmount: input.attributes.reasonableAmount ?? null,
              useInRecipes: input.attributes.useInRecipes ?? null,
            },
            { transaction: t },
          );
        }
      }

      await FoodCategory.destroy({ where: { foodCode: globalFoodId }, transaction: t });

      const categoryEntries
        = input.parentCategories === undefined
          ? []
          : input.parentCategories.map(categoryId => ({
              foodCode: globalFoodId,
              categoryCode: categoryId,
            }));

      await FoodCategory.bulkCreate(categoryEntries, { transaction: t });

      return await Food.findOne({
        where: { code: globalFoodId },
        include: [FoodAttribute, Category],
        transaction: t,
      });
    });

    // Sync to OpenSearch for all locales (after transaction commits)
    if (result) {
      await syncFoodToAllLocales(globalFoodId);
    }

    return result;
  };

  const read = async (foodId: string): Promise<FoodEntry | null> => {
    return await Food.findOne({ where: { code: foodId }, include: [FoodAttribute, Category] });
  };

  return {
    create,
    read,
    update,
  };
}

export default globalFoodsService;

export type GlobalFoodsService = ReturnType<typeof globalFoodsService>;
