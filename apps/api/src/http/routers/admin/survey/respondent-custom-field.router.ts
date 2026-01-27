import { initServer } from '@ts-rest/express';

import { ForbiddenError, NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { Survey, UserCustomField } from '@intake24/db';

export function respondentCustomField() {
  return initServer().router(contract.admin.survey.respondentCustomField, {
    browse: {
      middleware: [permission('surveys')],
      handler: async ({ params: { username, surveyId }, query, req }) => {
        const { respondents } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          {
            attributes: ['id'],
            include: [{ association: 'respondents', where: { username } }],
            where: { id: surveyId },
          },
        );

        const userId = respondents?.at(0)?.userId;
        if (!userId)
          throw new NotFoundError();

        const fields = await UserCustomField.paginate({
          query,
          columns: ['name'],
          where: { userId },
          order: [['id', 'ASC']],
        });

        return { status: 200, body: fields };
      },
    },
    store: {
      middleware: [permission('surveys')],
      handler: async ({ body, params: { surveyId, username }, req }) => {
        const { respondents, userCustomFields } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          {
            attributes: ['id', 'userCustomFields'],
            include: [{ association: 'respondents', where: { username } }],
            where: { id: surveyId },
          },
        );

        if (!userCustomFields)
          throw new ForbiddenError();

        const userId = respondents?.at(0)?.userId;
        if (!userId)
          throw new NotFoundError();

        const entry = await UserCustomField.findOne({ attributes: ['id'], where: { userId, name: body.name } });
        if (entry)
          throw ValidationError.from({ path: 'name', i18n: { type: 'unique._' } });

        const customField = await UserCustomField.create({ ...body, userId });

        return { status: 201, body: customField };
      },
    },
    read: {
      middleware: [permission('surveys')],
      handler: async ({ params: { field, surveyId, username }, req }) => {
        const { respondents } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          { attributes: ['id'], include: [{ association: 'respondents', where: { username } }], where: { id: surveyId } },
        );

        const userId = respondents?.at(0)?.userId;
        if (!userId)
          throw new NotFoundError();

        const customField = await UserCustomField.findOne({ where: { userId, name: field } });
        if (!customField)
          throw new NotFoundError();

        return { status: 200, body: customField };
      },
    },
    update: {
      middleware: [permission('surveys')],
      handler: async ({ body, params: { field, surveyId, username }, req }) => {
        const { respondents, userCustomFields } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          { attributes: ['id', 'userCustomFields'], include: [{ association: 'respondents', where: { username } }], where: { id: surveyId } },
        );

        if (!userCustomFields)
          throw new ForbiddenError();

        const userId = respondents?.at(0)?.userId;
        if (!userId)
          throw new NotFoundError();

        const customField = await UserCustomField.findOne({ where: { userId, name: field } });
        if (!customField)
          throw new NotFoundError();

        await customField.update(body);
        return { status: 200, body: customField };
      },
    },
    upsert: {
      middleware: [permission('surveys')],
      handler: async ({ body, params: { field, surveyId, username }, req }) => {
        const { respondents, userCustomFields } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          { attributes: ['id', 'userCustomFields'], include: [{ association: 'respondents', where: { username } }], where: { id: surveyId } },
        );

        if (!userCustomFields)
          throw new ForbiddenError();

        const userId = respondents?.at(0)?.userId;
        if (!userId)
          throw new NotFoundError();

        let customField = await UserCustomField.findOne({ where: { userId, name: field } });
        if (customField) {
          await customField.update(body);
          return { status: 200, body: customField };
        }

        customField = await UserCustomField.create({ ...body, name: field, userId });

        return { status: 201, body: customField };
      },
    },
    destroy: {
      middleware: [permission('surveys')],
      handler: async ({ params: { field, surveyId, username }, req }) => {
        const { respondents, userCustomFields } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          {
            attributes: ['id', 'userCustomFields'],
            include: [{ association: 'respondents', where: { username } }],
            where: { id: surveyId },
          },
        );

        if (!userCustomFields)
          throw new ForbiddenError();

        const userId = respondents?.at(0)?.userId;
        if (!userId)
          throw new NotFoundError();

        const result = await UserCustomField.destroy({ where: { userId, name: field } });
        if (!result)
          throw new NotFoundError();

        return { status: 204, body: undefined };
      },
    },
  });
}
