import type { NutrientUnitRequest } from '@intake24/common/types/http/admin';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { FoodsNutrientUnit, SystemNutrientUnit } from '@intake24/db';

function nutrientUnitService() {
  /**
   * Get nutrient unit record
   *
   * @param {string} nutrientUnitId
   */
  const getNutrientUnit = async (nutrientUnitId: string) => {
    const [foodsNutrientUnit, systemNutrientUnit] = await Promise.all([
      FoodsNutrientUnit.findByPk(nutrientUnitId),
      SystemNutrientUnit.findByPk(nutrientUnitId),
    ]);
    if (!foodsNutrientUnit || !systemNutrientUnit)
      throw new NotFoundError();

    return foodsNutrientUnit;
  };

  /**
   * Create nutrient unit
   *
   * @param {NutrientUnitRequest} input
   */
  const createNutrientUnit = async (input: NutrientUnitRequest) => {
    const [foodsNutrientUnit] = await Promise.all([
      FoodsNutrientUnit.create(input),
      SystemNutrientUnit.create(input),
    ]);

    return foodsNutrientUnit;
  };

  /**
   * Update nutrient unit
   *
   * @param {string} nutrientUnitId
   * @param {Omit<NutrientUnitRequest, 'id'>} input
   * @returns
   */
  const updateNutrientUnit = async (
    nutrientUnitId: string,
    input: Omit<NutrientUnitRequest, 'id'>,
  ) => {
    const [foodsNutrientUnit, systemNutrientUnit] = await Promise.all([
      FoodsNutrientUnit.findByPk(nutrientUnitId),
      SystemNutrientUnit.findByPk(nutrientUnitId),
    ]);
    if (!foodsNutrientUnit || !systemNutrientUnit)
      throw new NotFoundError();

    await Promise.all([foodsNutrientUnit.update(input), systemNutrientUnit.update(input)]);

    return foodsNutrientUnit;
  };

  /**
   * Delete nutrient unit
   *
   * @param {string} nutrientUnitId
   */
  const deleteNutrientUnit = async (nutrientUnitId: string) => {
    const [foodsNutrientUnit, systemNutrientUnit] = await Promise.all([
      FoodsNutrientUnit.findByPk(nutrientUnitId, {
        attributes: ['id'],
        include: [{ association: 'nutrientTypes' }],
      }),
      SystemNutrientUnit.findByPk(nutrientUnitId, {
        attributes: ['id'],
        include: [{ association: 'nutrientTypes' }],
      }),
    ]);

    if (
      !foodsNutrientUnit
      || !foodsNutrientUnit.nutrientTypes
      || !systemNutrientUnit
      || !systemNutrientUnit.nutrientTypes
    ) {
      throw new NotFoundError();
    }

    if (foodsNutrientUnit.nutrientTypes.length || systemNutrientUnit.nutrientTypes.length) {
      throw new ForbiddenError(
        'Nutrient unit cannot be deleted. There are nutrient types using this nutrient unit.',
      );
    }

    await Promise.all([foodsNutrientUnit.destroy(), systemNutrientUnit.destroy()]);
  };

  return {
    getNutrientUnit,
    createNutrientUnit,
    updateNutrientUnit,
    deleteNutrientUnit,
  };
}

export default nutrientUnitService;

export type NutrientUnitService = ReturnType<typeof nutrientUnitService>;
