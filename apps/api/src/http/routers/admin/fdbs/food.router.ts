import type { WhereOptions } from 'sequelize';

import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { unique } from '@intake24/api/http/rules';
import { contract } from '@intake24/common/contracts';
import { Food, SystemLocale } from '@intake24/db';

async function uniqueMiddleware(value: any, { foodId, field, localeId }: { foodId?: string; field: string; localeId: string }) {
  const where: WhereOptions = foodId ? { localeId, id: { [Op.ne]: foodId } } : { localeId };

  if (!(await unique({ model: Food, condition: { field, value }, options: { where } }))) {
    throw ValidationError.from({ code: '$unique', path: field, i18n: { type: 'unique._' } });
  }
}

export function food() {
  return initServer().router(contract.admin.fdbs.food, {
    browse: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId }, query, req }) => {
        const { aclService, adminFoodService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        const foods = await adminFoodService.browseFoods(code, query);

        return { status: 200, body: foods };
      },
    },
    store: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { localeId }, req }) => {
        const { aclService, adminFoodService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
          attributes: ['code'],
          where: { id: localeId },
        });
        await uniqueMiddleware(body.code, { field: 'code', localeId: code });

        const food = await adminFoodService.createFood(code, body);

        return { status: 201, body: food };
      },
    },
    getByCode: {
      middleware: [permission('locales')],
      handler: async ({ params: { code, localeId }, req }) => {
        const { aclService, adminFoodService } = req.scope.cradle;

        const { code: localeCode } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        const food = await adminFoodService.getFood({ localeId: localeCode, code });
        if (!food)
          throw new NotFoundError();

        return { status: 201, body: food };
      },
    },
    read: {
      middleware: [permission('locales')],
      handler: async ({ params: { foodId, localeId }, req }) => {
        const { aclService, adminFoodService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        const food = await adminFoodService.getFood({ id: foodId, localeId: code });
        if (!food)
          throw new NotFoundError();

        return { status: 200, body: food };
      },
    },
    update: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { foodId, localeId }, req }) => {
        const { aclService, adminFoodService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
          attributes: ['code'],
          where: { id: localeId },
        });
        await uniqueMiddleware(body.code, { field: 'code', foodId, localeId: code });

        const food = await adminFoodService.updateFood(code, foodId, body);

        return { status: 200, body: food };
      },
    },
    destroy: {
      middleware: [permission('locales')],
      handler: async ({ params: { foodId, localeId }, req }) => {
        const { aclService, adminFoodService } = req.scope.cradle;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
          attributes: ['code'],
          where: { id: localeId },
        });

        await adminFoodService.deleteFood(code, foodId);

        return { status: 204, body: undefined };
      },
    },
    copy: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { foodId, localeId }, req }) => {
        const { aclService, adminFoodService } = req.scope.cradle;
        const input = body;

        const { code } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
          attributes: ['code'],
          where: { id: localeId },
        });
        await uniqueMiddleware(body.code, { field: 'code', foodId, localeId: code });

        if (input.localeId && localeId !== input.localeId) {
          const { code: inputLocaleCode } = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list:edit', {
            attributes: ['code'],
            where: { id: input.localeId },
          });

          input.localeId = inputLocaleCode;
        }
        else {
          input.localeId = code;
        }

        const food = await adminFoodService.copyFood(code, foodId, body);

        return { status: 200, body: food };
      },
    },
    categories: {
      middleware: [permission('locales')],
      handler: async ({ params: { foodId, localeId }, req }) => {
        const { aclService, cachedParentCategoriesService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(SystemLocale, 'food-list', {
          attributes: ['code'],
          where: { id: localeId },
        });

        const categories = await cachedParentCategoriesService.getFoodAllCategories(foodId);

        return { status: 200, body: categories };
      },
    },
  });
}
