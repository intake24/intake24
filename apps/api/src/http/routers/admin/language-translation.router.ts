import { initServer } from '@ts-rest/express';

import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { Language } from '@intake24/db';

export function languageTranslation() {
  return initServer().router(contract.admin.languageTranslation, {
    browse: {
      middleware: [
        permission('languages'),
      ],
      handler: async ({ params: { languageId }, req }) => {
        const { aclService, languageService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(Language, 'translations', {
          attributes: ['id'],
          where: { id: languageId },
        });

        const translations = (await languageService.getLanguageTranslations(languageId));

        return { status: 200, body: translations };
      },
    },
    store: {
      middleware: [
        permission('languages'),
      ],
      handler: async ({ params: { languageId }, req }) => {
        const { aclService, languageService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(Language, 'translations', {
          attributes: ['id'],
          where: { id: languageId },
        });

        const translations = await languageService.getOrCreateLanguageTranslations(languageId);

        return { status: 201, body: translations };
      },
    },
    update: {
      middleware: [
        permission('languages'),
      ],
      handler: async ({ body, params: { languageId }, req }) => {
        const { aclService, languageService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(Language, 'translations', {
          attributes: ['id'],
          where: { id: languageId },
        });

        const translations = await languageService.updateLanguageTranslations(languageId, body.translations);

        return { status: 200, body: translations };
      },
    },
    destroy: {
      middleware: [
        permission('languages'),
      ],
      handler: async ({ params: { languageId }, req }) => {
        const { aclService, languageService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(Language, 'translations', {
          attributes: ['id'],
          where: { id: languageId },
        });

        await languageService.deleteLanguageTranslations(languageId);

        return { status: 204, body: undefined };
      },
    },
    sync: {
      middleware: [
        permission('languages'),
      ],
      handler: async ({ params: { languageId }, req }) => {
        const { aclService, languageService } = req.scope.cradle;

        await aclService.findAndCheckRecordAccess(Language, 'translations', {
          attributes: ['id'],
          where: { id: languageId },
        });

        await languageService.syncLanguageTranslations(languageId);
        const translations = await languageService.getLanguageTranslations(languageId);

        return { status: 201, body: translations };
      },
    },
  });
}
