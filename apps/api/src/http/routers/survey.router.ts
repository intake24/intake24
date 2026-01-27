import type { Request } from 'express';

import { initServer } from '@ts-rest/express';

import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { Survey } from '@intake24/db';

import { NotFoundError } from '../errors';
import { publicSurveyEntryResponse } from '../responses';
import { captchaCheck } from '../rules';

export function survey() {
  const generateUserLimiter = ioc.cradle.rateLimiter.createMiddleware('generateUser', {
    message: (req: Request) => req.scope.cradle.i18nService.translate('rateLimit.generateUser'),
    skipFailedRequests: true,
  });
  const captchaConfig = ioc.cradle.servicesConfig.captcha;

  return initServer().router(contract.public.survey, {
    browse: async () => {
      const surveys = await Survey.findAll({
        attributes: [
          'id',
          'slug',
          'name',
          'localeId',
          'originatingUrl',
          'supportEmail',
          'genUserKey',
          'allowGenUsers',
          'authCaptcha',
          'authModes',
        ],
        where: { allowGenUsers: true, genUserKey: null },
        order: [['name', 'ASC']],
      });

      return { status: 200, body: surveys.map(publicSurveyEntryResponse) };
    },
    entry: async ({ params }) => {
      const { slug } = params;

      const survey = await Survey.findBySlug(slug, {
        attributes: [
          'id',
          'slug',
          'name',
          'localeId',
          'originatingUrl',
          'supportEmail',
          'genUserKey',
          'allowGenUsers',
          'authCaptcha',
          'authModes',
        ],
      });
      if (!survey)
        throw new NotFoundError();

      return { status: 200, body: publicSurveyEntryResponse(survey) };
    },
    generateUser: {
      middleware: [generateUserLimiter],
      handler: async ({ body: { captcha }, params: { slug }, req }) => {
        await captchaCheck(captcha, captchaConfig);

        const {
          respondent: { username },
          password,
        } = await req.scope.cradle.surveyService.generateRespondent(slug);

        return { status: 200, body: { username, password } };
      },
    },
    createUser: async ({ body: { token }, params: { slug }, req }) => {
      const data = await req.scope.cradle.surveyService.createRespondentWithJWT(slug, token);

      return { status: 200, body: data };
    },
  });
}
