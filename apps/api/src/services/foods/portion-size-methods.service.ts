import { NotFoundError } from '@intake24/api/http/errors';
import {
  getCategoryParentCategories,
  getFoodParentCategories,
} from '@intake24/api/services/foods/common';
import type { PortionSizeMethod } from '@intake24/common/surveys';
import type { UserPortionSizeMethod } from '@intake24/common/types/http/foods/user-food-data';
import type { FoodPortionSizeMethod } from '@intake24/db';
import {
  AsServedSet,
  CategoryPortionSizeMethod,
  DrinkwareSet,
  Food,
  GuideImage,
} from '@intake24/db';

function portionSizeMethodsService(imagesBaseUrl: string) {
  /**
   *
   * Get Portion Size Methods and their Parameters associated with the supplied category.
   *
   * @param {string} categoryId
   */
  const getCategoryPortionSizeMethods = async (categoryId: string) =>
    CategoryPortionSizeMethod.findAll({
      attributes: [
        'method',
        'description',
        'useForRecipes',
        'conversionFactor',
        'orderBy',
        'parameters',
      ],
      order: [['orderBy', 'ASC']],
      where: { categoryId },
    });

  const getNearestCategoryPortionSizeMethods = async (categoryIds: string[]): Promise<CategoryPortionSizeMethod[]> => {
    for (const categoryId of categoryIds) {
      const methods = await getCategoryPortionSizeMethods(categoryId);

      if (methods.length)
        return methods;
    }

    const parents = await getCategoryParentCategories(categoryIds);

    if (parents.length)
      return getNearestCategoryPortionSizeMethods(parents);

    return [];
  };

  /**
   *
   * Get food data record
   *
   * @param {string} foodId
   * @returns {Promise<Food>}
   */
  const getFood = async (foodId: string): Promise<Food | null> =>
    Food.findByPk(foodId, {
      include: [
        {
          association: 'portionSizeMethods',
          attributes: [
            'method',
            'description',
            'useForRecipes',
            'conversionFactor',
            'orderBy',
            'parameters',
          ],
          separate: true,
          order: [['orderBy', 'ASC']],
        },
      ],
    });

  const resolvePortionSizeMethods = async (foodId: string): Promise<(CategoryPortionSizeMethod | FoodPortionSizeMethod)[]> => {
    const food = await getFood(foodId);
    if (!food)
      return [];

    if (food.portionSizeMethods?.length)
      return food.portionSizeMethods;

    const parentCategories = await getFoodParentCategories(food.id);
    if (!parentCategories.length)
      return [];

    return await getNearestCategoryPortionSizeMethods(parentCategories);
  };

  async function getPortionSizeImageUrl(psm: PortionSizeMethod): Promise<string> {
    switch (psm.method) {
      case 'as-served': {
        const set = await AsServedSet.findByPk(psm.parameters.servingImageSet, {
          attributes: ['id'],
          include: [{ association: 'selectionImage', attributes: ['path'] }],
        });

        if (!set)
          throw new NotFoundError(`As served set ${psm.parameters.servingImageSet} not found`);

        if (!set.selectionImage) {
          throw new NotFoundError(
            `Selection screen image for as served set ${psm.parameters.servingImageSet} is undefined`,
          );
        }

        return set.selectionImage.path;
      }

      case 'guide-image': {
        const guideImage = await GuideImage.findByPk(psm.parameters.guideImageId, {
          attributes: ['id'],
          include: [{ association: 'selectionImage', attributes: ['path'] }],
        });

        if (!guideImage)
          throw new NotFoundError(`Guide image ${psm.parameters.guideImageId} not found`);

        if (!guideImage.selectionImage) {
          throw new NotFoundError(
            `Selection screen image for guide image ${psm.parameters.guideImageId} is undefined`,
          );
        }

        return guideImage.selectionImage.path;
      }

      case 'drink-scale': {
        const set = await DrinkwareSet.findByPk(psm.parameters.drinkwareId, {
          attributes: ['id'],
          include: [
            {
              association: 'imageMap',
              attributes: ['id'],
              include: [{ association: 'baseImage', attributes: ['path'] }],
            },
          ],
        });

        if (!set)
          throw new NotFoundError(`Drinkware set ${psm.parameters.drinkwareId} not found`);

        if (!set.imageMap?.baseImage) {
          throw new NotFoundError(
            `Drink scale image map for drinkware set ${psm.parameters.drinkwareId} is undefined`,
          );
        }

        return set.imageMap.baseImage.path;
      }

      case 'standard-portion':
      case 'milk-in-a-hot-drink':
      case 'parent-food-portion':
      case 'direct-weight':
      case 'recipe-builder':
        return 'portion/standard-portion.jpg';

      case 'pizza':
      case 'pizza-v2':
        return 'portion/pizza.jpg';

      case 'cereal':
      case 'milk-on-cereal':
        return 'portion/cereal.jpg';
      case 'unknown':
        return '';

      default:
        throw new Error(
          `Unexpected portion size method type: ${(psm as PortionSizeMethod).method}`,
        );
    }
  }

  const resolveUserPortionSizeMethods = async (foodId: string): Promise<UserPortionSizeMethod[]> => {
    const psms = await resolvePortionSizeMethods(foodId);

    return Promise.all(
      psms.map(async psm => ({
        ...psm.get(),
        imageUrl: `${imagesBaseUrl}/${await getPortionSizeImageUrl(psm as PortionSizeMethod)}`,
      })),
    );
  };

  return {
    getPortionSizeImageUrl,
    resolvePortionSizeMethods,
    resolveUserPortionSizeMethods,
  };
}

export default portionSizeMethodsService;

export type PortionSizeMethodsService = ReturnType<typeof portionSizeMethodsService>;
