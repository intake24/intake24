import { initServer } from '@ts-rest/express';

import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { SystemLocale } from '@intake24/db';

export function synonymSet() {
  return initServer().router(contract.admin.locale.synonymSet, {
    get: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId }, req }) => {
        const { aclService, adminLocaleService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'synonym-sets', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const synonymSets = await adminLocaleService.getSynonymSets(locale);

        return { status: 200, body: synonymSets };
      },
    },
    set: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { localeId }, req }) => {
        const { aclService, adminLocaleService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'synonym-sets', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const synonymSets = await adminLocaleService.setSynonymSets(locale, body);

        return { status: 200, body: synonymSets };
      },
    },
  });
}
