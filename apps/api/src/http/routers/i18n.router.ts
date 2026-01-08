import { initServer } from '@ts-rest/express';
import { pick } from 'lodash-es';

import { NotFoundError } from '@intake24/api/http/errors';
import { contract } from '@intake24/common/contracts';
import type { Includeable } from '@intake24/db';
import { Language } from '@intake24/db';
import type { LocaleMessageDictionary } from '@intake24/i18n';

export function i18n() {
  return initServer().router(contract.public.i18n, {
    browseLanguages: async () => {
      const languages = await Language.scope('public').findAll();

      return {
        status: 200,
        body: languages,
      };
    },
    getLanguage: async ({ params: { languageId }, query: { app } }) => {
      const include: Includeable[] = [
        { association: 'translations', where: { application: [app, 'shared'] }, required: false },
      ];

      let language = await Language.scope('public').findOne({
        where: { code: languageId },
        include,
      });

      if (!language && languageId.includes('-')) {
        const [fallback] = languageId.split('-');
        language = await Language.scope('public').findOne({ where: { code: fallback }, include });
      }

      if (!language)
        throw new NotFoundError();

      const response = {
        ...pick(language, [
          'id',
          'code',
          'englishName',
          'localName',
          'countryFlagCode',
          'textDirection',
        ]),
        messages:
          language.translations?.reduce<LocaleMessageDictionary<any>>((acc, { section, messages }) => {
            acc[section] = messages;
            return acc;
          }, {}) ?? {},
      };

      return {
        status: 200,
        body: response,
      };
    },
  });
}
