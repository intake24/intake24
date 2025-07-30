import type { AppRoute, AppRouter } from '@ts-rest/core';
import type { TsRestRequest } from '@ts-rest/express';
import type { ModelStatic, WhereOptions } from 'sequelize';
import path from 'node:path';
import { initServer } from '@ts-rest/express';
import { pick } from 'lodash';
import multer from 'multer';
import { col, fn, Op } from 'sequelize';
import { ForbiddenError, NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { surveyListResponse, surveyResponse } from '@intake24/api/http/responses/admin';
import { unique } from '@intake24/api/http/rules';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { jobRequiresFile } from '@intake24/common/types';
import { multerFile } from '@intake24/common/types/http';
import { kebabCase } from '@intake24/common/util';
import type { PaginateOptions } from '@intake24/db';
import {
  createSurveyFields,
  FAQ,
  FeedbackScheme,
  guardedSurveyFields,
  overridesFields,
  securableIncludes,
  securableScope,
  Survey,
  SurveyScheme,
  SystemLocale,
  updateSurveyFields,
  UserSecurable,
} from '@intake24/db';

const actionToFieldsMap: Record<'overrides', readonly string[]> = {
  overrides: overridesFields,
};

async function uniqueMiddleware(value: any, { surveyId, field = 'name' }: { surveyId?: string; field?: string } = {}) {
  const where: WhereOptions = surveyId ? { id: { [Op.ne]: surveyId } } : {};

  if (!(await unique({ model: Survey, condition: { field, value }, options: { where } }))) {
    throw ValidationError.from({ path: field, i18n: { type: 'unique._' } });
  }
}

async function checkVisibility<T extends AppRoute | AppRouter>(values: Partial<Record<'faqId' | 'feedbackSchemeId' | 'localeId' | 'surveySchemeId', string | null | undefined>>, req: TsRestRequest<T>, survey?: Survey) {
  const models: Record<string, ModelStatic<any>> = {
    faqId: FAQ,
    feedbackSchemeId: FeedbackScheme,
    localeId: SystemLocale,
    surveySchemeId: SurveyScheme,
  };

  for (const [key, value] of Object.entries(values)) {
    const keyName = key as 'faqId' | 'feedbackSchemeId' | 'localeId' | 'surveySchemeId';

    if (!value || (survey && survey[keyName] === value))
      continue;

    try {
      await req.scope.cradle.aclService.findAndCheckVisibility(
        models[keyName],
        'use',
        { attributes: ['id', 'ownerId', 'visibility'], where: { id: value } },
      );
    }
    catch {
      throw ValidationError.from({ code: '$restricted', path: key, i18n: { type: 'restricted._' } });
    }
  }
}

export function survey() {
  const upload = multer({ dest: ioc.cradle.fsConfig.local.uploads });

  return initServer().router(contract.admin.survey.survey, {
    browse: {
      middleware: [permission('surveys')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions = {
          query,
          columns: ['slug', 'name'],
          order: [[fn('lower', col('Survey.name')), 'ASC']],
          attributes: ['id', 'localeId', 'name', 'slug', 'state', 'surveySchemeId'],
          include: [
            { association: 'locale', attributes: ['code'] },
            { association: 'surveyScheme', attributes: ['name'] },
          ],
          transform: surveyListResponse,
        };

        if (await aclService.hasPermission('surveys:browse')) {
          const surveys = await Survey.paginate(paginateOptions);
          return { status: 200, body: surveys };
        }

        const surveys = await Survey.paginate({
          ...paginateOptions,
          where: { [Op.or]: { ownerId: userId, '$securables.action$': ['read', 'edit', 'delete'] } },
          include: [
            { association: 'locale', attributes: ['code'] },
            { association: 'surveyScheme', attributes: ['name'] },
            ...securableIncludes(userId),
          ],
          subQuery: false,
        });

        return { status: 200, body: surveys };
      },
    },
    store: {
      middleware: [permission('surveys', 'surveys:create')],
      handler: async ({ body, req }) => {
        await Promise.all([
          uniqueMiddleware(body.name),
          uniqueMiddleware(body.slug, { field: 'slug' }),
          checkVisibility(pick(body, ['faqId', 'feedbackSchemeId', 'localeId', 'surveySchemeId']), req),
        ]);

        const { userId } = req.scope.cradle.user;

        let survey: Survey | null = await Survey.create({
          ...pick(body, createSurveyFields),
          ownerId: userId,
        });

        survey = await Survey.scope(['locale', 'feedbackScheme', 'surveyScheme']).findByPk(
          survey.id,
          securableScope(userId),
        );
        if (!survey)
          throw new NotFoundError();

        return { status: 201, body: surveyResponse(survey) };
      },
    },
    read: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId }, req }) => {
        const survey = await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'read', {
          where: { id: surveyId },
          include: [
            { association: 'faq', attributes: ['id', 'name'] },
            { association: 'locale' },
            { association: 'feedbackScheme' },
            { association: 'surveyScheme' },
          ],
        });

        return { status: 200, body: surveyResponse(survey) };
      },
    },
    patch: {
      middleware: [permission('surveys')],
      handler: async ({ body, params: { surveyId }, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        await uniqueMiddleware(body.name, { surveyId });

        const survey = await aclService.findAndCheckRecordAccess(Survey, 'edit', {
          where: { id: surveyId },
          include: [
            { association: 'locale' },
            { association: 'feedbackScheme' },
            { association: 'surveyScheme' },
          ],
        });

        await checkVisibility(pick(body, ['faqId', 'feedbackSchemeId', 'localeId', 'surveySchemeId']), req, survey);

        const keysToUpdate: string[] = [];
        const [resourceActions, securableActions] = await Promise.all([
          aclService.getResourceAccessActions('surveys'),
          aclService.getSecurableAccessActions(survey),
        ]);

        if (resourceActions.includes('edit')) {
          keysToUpdate.push(...updateSurveyFields, ...overridesFields, ...guardedSurveyFields);
        }
        else if (survey.ownerId === userId) {
          keysToUpdate.push(...updateSurveyFields, ...overridesFields);
        }
        else {
          if (securableActions.includes('edit'))
            keysToUpdate.push(...updateSurveyFields);

          (Object.keys(actionToFieldsMap) as (keyof typeof actionToFieldsMap)[]).forEach((item) => {
            if (securableActions.includes(kebabCase(item)))
              keysToUpdate.push(...actionToFieldsMap[item]);
          });
        }

        const updateInput = pick(body, keysToUpdate);
        if (!Object.keys(updateInput).length)
          throw new ValidationError('Missing body');

        await survey.update(updateInput);
        await survey.reload({
          include: [
            { association: 'faq', attributes: ['id', 'name'] },
            { association: 'locale' },
            { association: 'feedbackScheme' },
            { association: 'surveyScheme' },
          ],
        });

        return { status: 200, body: surveyResponse(survey) };
      },
    },
    put: {
      middleware: [permission('surveys', 'surveys:edit')],
      handler: async ({ body, params: { surveyId }, req }) => {
        await uniqueMiddleware(body.name, { surveyId });

        const survey = await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'edit', {
          where: { id: surveyId },
          include: [
            { association: 'faq', attributes: ['id', 'name'] },
            { association: 'locale' },
            { association: 'feedbackScheme' },
            { association: 'surveyScheme' },
          ],
        });
        await checkVisibility(pick(body, ['faqId', 'feedbackSchemeId', 'localeId', 'surveySchemeId']), req, survey);

        await survey.update(
          pick(body, [...updateSurveyFields, ...overridesFields, ...guardedSurveyFields]),
        );

        await survey.reload({
          include: [
            { association: 'locale' },
            { association: 'feedbackScheme' },
            { association: 'surveyScheme' },
          ],
        });

        return { status: 200, body: surveyResponse(survey) };
      },
    },
    destroy: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId }, req }) => {
        const survey = await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'delete', {
          attributes: ['id', 'slug'],
          where: { id: surveyId },
          include: [{ association: 'submissions', attributes: ['id'] }],
        });
        const { id: securableId, submissions } = survey;

        if (!submissions || submissions.length)
          throw new ForbiddenError('Survey cannot be deleted. It already contains submission data.');

        await Promise.all([
          UserSecurable.destroy({ where: { securableId, securableType: 'Survey' } }),
          survey.destroy(),
        ]);

        return { status: 204, body: undefined };
      },
    },
    tasks: {
      middleware: [permission('surveys'), upload.single('params[file]')],
      handler: async ({ file, params: { surveyId }, body, req }) => {
        const {
          aclService,
          adminSurveyService,
          user: { userId },
        } = req.scope.cradle;

        const params = { ...body.params, surveyId };
        const { type } = body;

        if (jobRequiresFile(type)) {
          if (!file)
            throw ValidationError.from({ path: 'params.file', i18n: { type: 'file._' } });

          const res = multerFile.safeParse(file);
          if (!res.success)
            throw ValidationError.from({ path: 'params.file', i18n: { type: 'file._' } });

          if (path.extname(res.data.originalname).toLowerCase() !== '.csv')
            throw ValidationError.from({ path: 'params.file', i18n: { type: 'file.ext', params: { ext: 'CSV (comma-delimited)' } } });

          // @ts-expect-error not narrowed yet
          params.file = res.data.path;
        }

        await aclService.findAndCheckRecordAccess(Survey, 'tasks', {
          attributes: ['id'],
          where: { id: surveyId },
        });

        const job = await adminSurveyService.queueTask({
          userId,
          type,
          params,
        });

        return { status: 200, body: job };
      },
    },
  });
}
