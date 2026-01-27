import type { NutrientTypeRequest } from '@intake24/common/types/http/admin';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { FoodsNutrientType, NutrientTypeInKcal, SystemNutrientType } from '@intake24/db';

function nutrientTypeService() {
  /**
   * Get nutrient type record
   *
   * @param {string} nutrientTypeId
   */
  const getNutrientType = async (nutrientTypeId: string) => {
    const [foodsNutrientType, systemNutrientType] = await Promise.all([
      FoodsNutrientType.findByPk(nutrientTypeId, {
        include: [{ association: 'unit' }, { association: 'inKcal' }],
      }),
      SystemNutrientType.findByPk(nutrientTypeId),
    ]);
    if (!foodsNutrientType || !systemNutrientType)
      throw new NotFoundError();

    return foodsNutrientType;
  };

  /**
   * Create nutrient type
   *
   * @param {NutrientTypeRequest} input
   */
  const createNutrientType = async (input: NutrientTypeRequest) => {
    const { kcalPerUnit, ...rest } = input;

    const [foodsNutrientType] = await Promise.all([
      FoodsNutrientType.create(rest),
      SystemNutrientType.create(rest),
    ]);

    if (kcalPerUnit)
      await NutrientTypeInKcal.create({ nutrientTypeId: foodsNutrientType.id, kcalPerUnit });

    return foodsNutrientType.reload({
      include: [{ association: 'unit' }, { association: 'inKcal' }],
    });
  };

  /**
   * Update nutrient type
   *
   * @param {string} nutrientTypeId
   * @param {Omit<NutrientTypeRequest, 'id'>} input
   * @returns
   */
  const updateNutrientType = async (
    nutrientTypeId: string,
    input: Omit<NutrientTypeRequest, 'id'>,
  ) => {
    const { kcalPerUnit, ...rest } = input;

    const [foodsNutrientType, systemNutrientType] = await Promise.all([
      FoodsNutrientType.findByPk(nutrientTypeId, {
        include: [{ association: 'unit' }, { association: 'inKcal' }],
      }),
      SystemNutrientType.findByPk(nutrientTypeId, { include: [{ association: 'unit' }] }),
    ]);
    if (!foodsNutrientType || !systemNutrientType)
      throw new NotFoundError();

    await Promise.all([foodsNutrientType.update(rest), systemNutrientType.update(rest)]);

    if (kcalPerUnit) {
      if (foodsNutrientType.inKcal)
        await foodsNutrientType.inKcal.update({ kcalPerUnit });
      else await NutrientTypeInKcal.create({ nutrientTypeId: foodsNutrientType.id, kcalPerUnit });
    }
    else if (kcalPerUnit === null) {
      await NutrientTypeInKcal.destroy({ where: { nutrientTypeId: foodsNutrientType.id } });
    }

    return foodsNutrientType.reload({
      include: [{ association: 'unit' }, { association: 'inKcal' }],
    });
  };

  /**
   * Delete nutrient type
   *
   * @param {string} nutrientTypeId
   */
  const deleteNutrientType = async (nutrientTypeId: string) => {
    const [foodsNutrientType, systemNutrientType] = await Promise.all([
      FoodsNutrientType.findByPk(nutrientTypeId, { attributes: ['id'] }),
      SystemNutrientType.findByPk(nutrientTypeId, { attributes: ['id'] }),
    ]);
    if (!foodsNutrientType || !systemNutrientType)
      throw new NotFoundError();

    throw new ForbiddenError('Nutrient type cannot be deleted.');
    // TODO: Revive all foreign keys, some are not on cascade, also nutrient types are in both databases
    // await Promise.all([foodsNutrientType.destroy(), systemNutrientType.destroy()]);
  };

  return {
    getNutrientType,
    createNutrientType,
    updateNutrientType,
    deleteNutrientType,
  };
}

export default nutrientTypeService;

export type NutrientTypeService = ReturnType<typeof nutrientTypeService>;
