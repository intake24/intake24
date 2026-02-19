import type { IoC } from '@intake24/api/ioc';
import type { UserFoodData } from '@intake24/common/types/http/foods/user-food-data';

import { NotFoundError } from '@intake24/api/http/errors';
import { Food, FoodBuilder, NutrientTableRecordNutrient } from '@intake24/db';

import InvalidIdError from './invalid-id-error';
import PortionSizeMethodsImpl from './portion-size-methods.service';

// const for KCAL Nutrient
const KCAL_NUTRIENT_TYPE_ID = 1;

function foodDataService({ cachedParentCategoriesService, imagesBaseUrl }: Pick<IoC, 'cachedParentCategoriesService' | 'imagesBaseUrl'>) {
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

  const getFoodData = async (ops: { id: string } | { localeId: string; code: string }): Promise<UserFoodData> => {
    const food = await Food.findOne({
      where: ops,
      include: [
        {
          association: 'associatedFoods',
          attributes: [
            'id',
            'associatedFoodCode',
            'associatedCategoryCode',
            'text',
            'linkAsMain',
            'genericName',
            'multiple',
            'orderBy',
          ],
        },
        {
          association: 'brands',
          attributes: ['name'],
        },
        {
          association: 'portionSizeMethods',
          attributes: [
            'method',
            'description',
            'pathways',
            'conversionFactor',
            'orderBy',
            'parameters',
          ],
        },
      ],
    });

    if (!food)
      throw new InvalidIdError(`Invalid food, locale code: ${ops.toString()}`);

    const { id, code, localeId, associatedFoods = [], brands = [] } = food;
    const { attributes, codes: categories, tags } = await cachedParentCategoriesService.getFoodCache(id);

    const [kcalPer100g, portionSizeMethods] = await Promise.all([
      getNutrientKCalPer100G(id),
      portionSizeMethodsImpl.resolveUserPortionSizeMethods(id),
    ]);

    return {
      id,
      associatedFoodPrompts: associatedFoods
        .toSorted((a, b) => Number(a.orderBy) - Number(b.orderBy))
        .map(row => ({
          id: row.id,
          foodCode: row.associatedFoodCode ?? undefined,
          categoryCode: row.associatedCategoryCode ?? undefined,
          promptText: row.text,
          linkAsMain: row.linkAsMain,
          genericName: row.genericName,
          multiple: row.multiple,
        })),
      brandNames: brands.map(b => b.name),
      code,
      localeId,
      englishName: food.englishName,
      kcalPer100g,
      localName: food.name ?? food.englishName,
      categories,
      ...attributes,
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
