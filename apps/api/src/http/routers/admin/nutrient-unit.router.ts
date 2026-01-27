import { initServer } from '@ts-rest/express';

import { ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { unique } from '@intake24/api/http/rules';
import { contract } from '@intake24/common/contracts';
import { FoodsNutrientUnit, SystemNutrientUnit } from '@intake24/db';

async function uniqueMiddleware(value: string) {
  const [foodsNutrientUnit, systemNutrientUnit] = await Promise.all([
    unique({ model: FoodsNutrientUnit, condition: { field: 'id', value, ci: false } }),
    unique({ model: SystemNutrientUnit, condition: { field: 'id', value, ci: false } }),
  ]);

  if (!foodsNutrientUnit || !systemNutrientUnit) {
    throw ValidationError.from({ path: 'id', i18n: { type: 'unique._' } });
  }
}

export function nutrientUnit() {
  return initServer().router(contract.admin.nutrientUnit, {
    browse: {
      middleware: [permission('nutrient-units', 'nutrient-units:browse')],
      handler: async ({ query }) => {
        const nutrientUnits = await FoodsNutrientUnit.paginate({
          query,
          columns: ['description'],
          order: [['id', 'ASC']],
        });

        return { status: 200, body: nutrientUnits };
      },
    },
    store: {
      middleware: [permission('nutrient-units', 'nutrient-units:create')],
      handler: async ({ body, req }) => {
        await uniqueMiddleware(body.id);

        const nutrientUnit = await req.scope.cradle.nutrientUnitService.createNutrientUnit(body);

        return { status: 201, body: nutrientUnit };
      },
    },
    read: {
      middleware: [permission('nutrient-units', 'nutrient-units:read')],
      handler: async ({ params: { nutrientUnitId }, req }) => {
        const nutrientUnit
          = await req.scope.cradle.nutrientUnitService.getNutrientUnit(nutrientUnitId);

        return { status: 200, body: nutrientUnit };
      },
    },
    update: {
      middleware: [permission('nutrient-units', 'nutrient-units:edit')],
      handler: async ({ body, params: { nutrientUnitId }, req }) => {
        const nutrientUnit = await req.scope.cradle.nutrientUnitService.updateNutrientUnit(
          nutrientUnitId,
          body,
        );

        return { status: 200, body: nutrientUnit };
      },
    },
    destroy: {
      middleware: [permission('nutrient-units', 'nutrient-units:delete')],
      handler: async ({ params: { nutrientUnitId }, req }) => {
        await req.scope.cradle.nutrientUnitService.deleteNutrientUnit(nutrientUnitId);

        return { status: 204, body: undefined };
      },
    },
  });
}
