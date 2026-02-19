import type { IoC } from '@intake24/api/ioc';
import type {
  UserAssociatedFoodPrompt,
  UserFoodData,
} from '@intake24/common/types/http/foods/user-food-data';

import { NotFoundError } from '@intake24/api/http/errors';
import {
  AssociatedFood,
  Brand,
  Category,
  Food,
  FoodBuilder,
  NutrientTableRecordNutrient,
} from '@intake24/db';

import InvalidIdError from './invalid-id-error';
import PortionSizeMethodsImpl from './portion-size-methods.service';

// const for KCAL Nutrient
const KCAL_NUTRIENT_TYPE_ID = 1;

function foodDataService({ inheritableAttributesService, imagesBaseUrl, cachedParentCategoriesService }: Pick<IoC, 'inheritableAttributesService' | 'imagesBaseUrl' | 'cachedParentCategoriesService'>) {
  const { resolveFoodAttributes } = inheritableAttributesService;
  const portionSizeMethodsImpl = PortionSizeMethodsImpl(imagesBaseUrl);

  const getNutrientKCalPer100G = async (foodId: string): Promise<number> => {
    const nutrients = await NutrientTableRecordNutrient.findAll({
      attributes: ['unitsPer100g'],
      where: { nutrientTypeId: KCAL_NUTRIENT_TYPE_ID },
      include: [
        {
          association: 'record',
          attributes: ['id'],
          required: true,
          include: [
            {
              association: 'foodMappings',
              where: { foodId },
            },
          ],
        },
      ],
    });

    return nutrients.at(0)?.unitsPer100g ?? 0;
  };

  /**
   *
   * Get all associated Foods that link to this locale and Food Code
   *
   * @param {string} foodId
   * @returns {Promise<AssociatedFoodsResponse[]>}
   */
  const getAssociatedFoodPrompts = async (foodId: string): Promise<UserAssociatedFoodPrompt[]> => {
    const associatedFoods = await AssociatedFood.findAll({
      where: { foodId },
      attributes: [
        'id',
        'associatedCategoryCode',
        'associatedFoodCode',
        'text',
        'linkAsMain',
        'genericName',
        'multiple',
      ],
      order: [['orderBy', 'ASC']],
    });

    return associatedFoods.map(row => ({
      id: row.id,
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
   * @param {string} foodId
   * @returns {Promise<string[]>}
   */
  const getBrands = async (foodId: string): Promise<string[]> => {
    const brands = await Brand.findAll({ where: { foodId }, attributes: ['name'] });

    return brands.length ? brands.map(brand => brand.name) : [];
  };

  const getAllTags = async (id: string[], foodTags: string[] = []) => {
    const categories = await Category.findAll({ where: { id }, attributes: ['tags'] });

    return [...new Set(categories.reduce((acc, { tags }) => acc.concat(tags), foodTags))];
  };

  const getFoodData = async (ops: { id: string } | { localeId: string; code: string }): Promise<UserFoodData> => {
    const food = await Food.findOne({ where: ops });
    if (!food)
      throw new InvalidIdError(`Invalid food, locale code: ${ops.toString()}`);

    const { id, code, localeId } = food;
    const categoryIds = await cachedParentCategoriesService.getFoodAllCategories(id);

    const [
      associatedFoodPrompts,
      brandNames,
      categories,
      inheritableAttributes,
      kcalPer100g,
      portionSizeMethods,
      tags,
    ] = await Promise.all([
      getAssociatedFoodPrompts(id),
      getBrands(id),
      cachedParentCategoriesService.getFoodAllCategoryCodes(id),
      resolveFoodAttributes(id),
      getNutrientKCalPer100G(id),
      portionSizeMethodsImpl.resolveUserPortionSizeMethods(id),
      getAllTags(categoryIds, food.tags),
    ]);

    return {
      id,
      associatedFoodPrompts,
      brandNames,
      code,
      localeId,
      englishName: food.englishName,
      kcalPer100g,
      localName: food.name ?? food.englishName,
      categories,
      ...inheritableAttributes,
      portionSizeMethods,
      tags,
    };
  };

  async function getFoodBuilders(localeId: string, code: string | string[]): Promise<FoodBuilder[]> {
    return await FoodBuilder.findAll({
      where: { localeId, code },
      attributes: ['code', 'localeId', 'type', 'name', 'triggerWord', 'synonymSetId', 'steps'],
      include: [{ association: 'synonymSet', attributes: ['synonyms'] }],
      order: [['code', 'ASC']],
    });
  }

  async function getFoodBuilder(localeId: string, code: string): Promise<FoodBuilder> {
    const result = (await getFoodBuilders(localeId, [code])).at(0);
    if (!result)
      throw new NotFoundError('Recipe food not found');

    return result;
  }

  return {
    getNutrientKCalPer100G,
    getFoodData,
    getFoodBuilder,
    getFoodBuilders,
  };
}

export default foodDataService;

export type FoodDataService = ReturnType<typeof foodDataService>;
