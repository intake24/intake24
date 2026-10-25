import { initServer } from '@ts-rest/express';

import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { SystemLocale } from '@intake24/db';

export function splitWord() {
  return initServer().router(contract.admin.locale.splitWord, {
    get: {
      middleware: [permission('locales')],
      handler: async ({ params: { localeId }, req }) => {
        const { aclService, adminLocaleService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'split-words', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });

        const splitWords = await adminLocaleService.getSplitWords(locale);

        return { status: 200, body: splitWords };
      },
    },
    set: {
      middleware: [permission('locales')],
      handler: async ({ body, params: { localeId }, req }) => {
        const { aclService, adminLocaleService } = req.scope.cradle;

        const locale = await aclService.findAndCheckRecordAccess(SystemLocale, 'split-words', {
          attributes: ['id', 'code'],
          where: { id: localeId },
        });
        const splitWords = await adminLocaleService.setSplitWords(locale, body);

        return { status: 200, body: splitWords };
      },
    },
  });
}
