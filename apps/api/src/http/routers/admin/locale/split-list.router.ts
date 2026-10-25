import { initServer } from '@ts-rest/express';

import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { SystemLocale } from '@intake24/db';

export function splitList() {
  return initServer().router(contract.admin.locale.splitList, {
    get: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId }, req }) => {
        const { aclService, adminLocaleService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'split-lists', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const splitLists = await adminLocaleService.getSplitLists(locale);

        return { status: 200, body: splitLists };
      },
    },
    set: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { localeId }, req }) => {
        const { aclService, adminLocaleService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'split-lists', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const splitLists = await adminLocaleService.setSplitLists(locale, body);

        return { status: 200, body: splitLists };
      },
    },
  });
}
