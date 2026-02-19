import { initServer } from '@ts-rest/express';

import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { SystemLocale } from '@intake24/db';

export function foodBuilder() {
  return initServer().router(contract.admin.locale.foodBuilder, {
    get: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId }, req }) => {
        const { aclService, localeService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-builders', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const foodBuilders = await localeService.getFoodBuilders(locale);

        return { status: 200, body: foodBuilders };
      },
    },
    set: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { localeId }, req }) => {
        const { aclService, localeService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'food-builders', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });
        const foodBuilders = await localeService.setFoodBuilders(locale, body);

        return { status: 200, body: foodBuilders };
      },
    },
  });
}
