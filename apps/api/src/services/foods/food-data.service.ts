import { getParentLocale } from '@intake24/api/services/foods/common';
import InvalidIdError from '@intake24/api/services/foods/invalid-id-error';
import type {
  UserAssociatedFoodPrompt,
  UserFoodData,
} from '@intake24/common/types/http/foods/user-food-data';
import {
  AssociatedFood,
  Brand,
  CategoryCategory,
  CategoryLocal,
  Food,
  FoodCategory,
  FoodLocal,
  FoodLocalList,
  FoodsLocale,
} from '@intake24/db';

import InheritableAttributesImpl from './inheritable-attributes-service';
import PortionSizeMethodsImpl from './portion-size-methods.service';

// const for KCAL Nutrient
const KCAL_NUTRIENT_TYPE_ID = 1;

function foodDataService() {
  const inheritableAttributesImpl = InheritableAttributesImpl();
  const portionSizeMethodsImpl = PortionSizeMethodsImpl();

  const getNutrientKCalPer100G = async (localeId: string, foodCode: string): Promise<number> => {
    const foodNutrientData = await FoodLocal.findOne({
      where: { localeId, foodCode },
      attributes: [],
      include: [
        {
          association: 'nutrientRecords',
          attributes: ['id'], // these attributes should be empty, but sequelize crashes if that is the case
          through: { attributes: [] },
          duplicating: true,
          include: [
            {
              association: 'nutrients',
              where: { nutrientTypeId: KCAL_NUTRIENT_TYPE_ID },
              attributes: ['unitsPer100g'],
            },
          ],
        },
      ],
    });

    if (!foodNutrientData) {
      throw new InvalidIdError(
        `Either locale id '${localeId}' or food code '${foodCode}' is `
        + 'invalid, food isn\'t linked to a nutrient table record, or the energy (kcal) nutrient '
        + 'data is missing',
      );
    }

    let kcal = foodNutrientData?.nutrientRecords?.map((el) => {
      return el.nutrients ? el.nutrients[0].unitsPer100g : 0;
    })[0];
    kcal = kcal || 0;
    if (!kcal) {
      const parentLocale = await getParentLocale(localeId);
      if (parentLocale && parentLocale.prototypeLocaleId)
        kcal = await getNutrientKCalPer100G(parentLocale.prototypeLocaleId, foodCode);
    }
    return kcal;
  };

  /**
   *
   * Get all associated Foods that link to this locale and Food Code
   *
   * @param {string} localeId
   * @param {string} foodCode
   * @returns {Promise<AssociatedFoodsResponse[]>}
   */
  const getLocalAssociatedFoodPrompts = async (
    localeId: string,
    foodCode: string,
  ): Promise<UserAssociatedFoodPrompt[]> => {
    const associatedFoods = await AssociatedFood.findAll({
      where: { localeId, foodCode },
      attributes: [
        'associatedFoodCode',
        'associatedCategoryCode',
        'text',
        'linkAsMain',
        'genericName',
        'multiple',
      ],
      order: [['orderBy', 'ASC']],
    });

    return associatedFoods.map(row => ({
      foodCode: row.associatedFoodCode ?? undefined,
      categoryCode: row.associatedCategoryCode ?? undefined,
      promptText: row.text,
      linkAsMain: row.linkAsMain,
      genericName: row.genericName,
      multiple: row.multiple,
    }));
  };

  /**
   *
   * Get food brands based on the code of the food and localeId
   *
   * @param {string} localeId
   * @param {string} foodCode
   * @returns {Promise<string[]>}
   */
  const getBrands = async (localeId: string, foodCode: string): Promise<string[]> => {
    const brands = await Brand.findAll({ where: { localeId, foodCode }, attributes: ['name'] });

    return brands.length ? brands.map(brand => brand.name) : [];
  };

  /**
   * Finds all parent categories including transitive for foodCode
   * @param foodCode
   */
  const getAllCategories = async (foodCode: string): Promise<string[]> => {
    const visited = new Set<string>();

    let queue: { categoryCode: string }[] = await FoodCategory.findAll({
      where: { foodCode },
      attributes: ['categoryCode'],
    });

    while (queue.length > 0) {
      const newCodes = queue.map(row => row.categoryCode).filter(code => !visited.has(code));

      newCodes.forEach(code => visited.add(code));

      queue = await CategoryCategory.findAll({
        where: { subcategoryCode: newCodes },
        attributes: ['categoryCode'],
      });
    }

    return [...visited.values()];
  };

  const getAllTags = async (categoryCode: string[], foodTags: string[] = []) => {
    const categories = await CategoryLocal.findAll({ where: { categoryCode }, attributes: ['tags'] });

    return [...new Set(categories.reduce((acc, { tags }) => acc.concat(tags), foodTags))];
  };

  const resolveAssociatedFoodPrompts = async (
    localeId: string,
    foodCode: string,
  ): Promise<UserAssociatedFoodPrompt[]> => {
    const localPrompts = await getLocalAssociatedFoodPrompts(localeId, foodCode);

    if (localPrompts.length)
      return localPrompts;

    const locale = await FoodsLocale.findOne({
      where: { id: localeId },
      include: [{ association: 'parent' }],
    });

    if (!locale)
      throw new InvalidIdError(`Unknown locale ID: ${localeId}`);

    if (locale.parent && locale.respondentLanguageId === locale.parent.respondentLanguageId)
      return resolveAssociatedFoodPrompts(locale.parent.id, foodCode);

    return [];
  };

  const getFoodData = async (localeId: string, foodCode: string): Promise<UserFoodData> => {
    const foodRecord = await Food.findOne({ where: { code: foodCode } });

    if (!foodRecord)
      throw new InvalidIdError(`Invalid food code: ${foodCode}`);

    const foodListCheck = await FoodLocalList.findOne({
      where: { foodCode, localeId },
      attributes: ['food_code'],
    });

    if (!foodListCheck)
      throw new InvalidIdError(`${foodCode} is not in the food list for locale ${localeId}`);

    const localeCheck = await FoodsLocale.findOne({ where: { id: localeId }, attributes: ['id'] });
    if (!localeCheck)
      throw new InvalidIdError(`Invalid locale ID: ${localeId}`);

    const foodLocal = await FoodLocal.findOne({ where: { foodCode, localeId } });

    if (!foodLocal) {
      throw new InvalidIdError(
        `No local food data for food code ${foodCode} in locale ${localeId}`,
      );
    }

    const categories = await getAllCategories(foodCode);

    const [
      associatedFoodPrompts,
      brandNames,
      kcalPer100g,
      portionSizeMethods,
      inheritableAttributes,
      tags,
    ] = await Promise.all([
      resolveAssociatedFoodPrompts(localeId, foodCode),
      getBrands(localeId, foodCode),
      getNutrientKCalPer100G(localeId, foodCode),
      portionSizeMethodsImpl.resolveUserPortionSizeMethods(localeId, foodCode),
      inheritableAttributesImpl.resolveFoodAttributes(foodCode),
      getAllTags(categories, foodLocal.tags),
    ]);

    return {
      associatedFoodPrompts,
      brandNames,
      code: foodRecord.code,
      englishName: foodRecord.name,
      groupCode: foodRecord.foodGroupId,
      kcalPer100g,
      localName: foodLocal.name,
      portionSizeMethods,
      readyMealOption: inheritableAttributes.readyMealOption,
      reasonableAmount: inheritableAttributes.reasonableAmount,
      sameAsBeforeOption: inheritableAttributes.sameAsBeforeOption,
      categories,
      tags,
    };
  };

  return {
    getNutrientKCalPer100G,
    getFoodData,
  };
}

export default foodDataService;

export type FoodDataService = ReturnType<typeof foodDataService>;
