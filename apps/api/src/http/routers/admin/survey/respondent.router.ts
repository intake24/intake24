import type { Subject } from '@intake24/common/security';

import { initServer } from '@ts-rest/express';

import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { respondentResponse } from '@intake24/api/http/responses/admin';
import { atob } from '@intake24/api/util';
import { contract } from '@intake24/common/contracts';
import { Survey, UserSurveyAlias } from '@intake24/db';

export function respondent() {
  return initServer().router(contract.admin.survey.respondent, {
    browse: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId }, query, req }) => {
        const { slug, authUrlDomainOverride } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          { attributes: ['id', 'slug', 'authUrlDomainOverride'], where: { id: surveyId } },
        );

        const respondentRes = respondentResponse(req.scope.cradle.appConfig.urls, slug, authUrlDomainOverride);

        const respondents = await UserSurveyAlias.paginate({
          query,
          columns: ['username'],
          where: { surveyId },
          order: [['username', 'ASC']],
          transform: respondentRes.list,
        });

        return { status: 200, body: respondents };
      },
    },
    store: {
      middleware: [permission('surveys')],
      handler: async ({ body, params: { surveyId }, req }) => {
        const { slug, authUrlDomainOverride } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          { attributes: ['id', 'slug', 'authUrlDomainOverride'], where: { id: surveyId } },
        );

        const entry = await UserSurveyAlias.findOne({ attributes: ['id'], where: { surveyId, username: body.username } });
        if (entry)
          throw ValidationError.from({ path: 'username', i18n: { type: 'unique._' } });

        const respondent = await req.scope.cradle.adminSurveyService.createRespondent(surveyId, body);

        await respondent.reload({
          include: [{ association: 'user', include: [{ association: 'customFields' }] }],
        });

        const respondentRes = respondentResponse(req.scope.cradle.appConfig.urls, slug, authUrlDomainOverride);

        return { status: 201, body: respondentRes.entry(respondent) };
      },
    },
    read: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId, username }, req }) => {
        const { slug, authUrlDomainOverride } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          { attributes: ['id', 'slug', 'authUrlDomainOverride'], where: { id: surveyId } },
        );

        const respondent = await UserSurveyAlias.findOne({
          where: { surveyId, username },
          include: [{ association: 'user', include: [{ association: 'customFields' }] }],
        });
        if (!respondent)
          throw new NotFoundError();

        const respondentRes = respondentResponse(req.scope.cradle.appConfig.urls, slug, authUrlDomainOverride);

        return { status: 200, body: respondentRes.entry(respondent) };
      },
    },
    update: {
      middleware: [permission('surveys')],
      handler: async ({ body, params: { surveyId, username }, req }) => {
        const { slug, authUrlDomainOverride } = await req.scope.cradle.aclService.findAndCheckRecordAccess(
          Survey,
          'respondents',
          { attributes: ['id', 'slug', 'authUrlDomainOverride'], where: { id: surveyId } },
        );

        const respondent = await req.scope.cradle.adminSurveyService.updateRespondent(surveyId, username, body);

        await respondent.reload({
          include: [{ association: 'user', include: [{ association: 'customFields' }] }],
        });

        const respondentRes = respondentResponse(req.scope.cradle.appConfig.urls, slug, authUrlDomainOverride);

        return { status: 200, body: respondentRes.entry(respondent) };
      },
    },
    destroy: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId, username }, req }) => {
        await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'respondents', {
          attributes: ['id'],
          where: { id: surveyId },
        });

        await req.scope.cradle.adminSurveyService.deleteRespondent(surveyId, username);

        return { status: 204, body: undefined };
      },
    },
    downloadFeedback: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId, username }, query: { submissions }, req, res }) => {
        await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'respondents', {
          attributes: ['id'],
          where: { id: surveyId },
        });

        const { pdfStream, filename } = await req.scope.cradle.feedbackService.getFeedbackStream({ surveyId, username, submissions });

        res.set('content-disposition', `attachment; filename=${filename}`);

        return { status: 200, contentType: 'application/pdf', body: pdfStream };
      },
    },
    emailFeedback: {
      middleware: [permission('surveys')],
      handler: async ({ body: { email, copy }, params: { surveyId, username }, req }) => {
        await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'respondents', {
          attributes: ['id'],
          where: { id: surveyId },
        });

        const subject = atob<Subject>(req.scope.cradle.user.sub);
        const { userId } = req.scope.cradle.user;
        const userEmail = subject.provider === 'email' ? subject.providerKey : undefined;

        await req.scope.cradle.scheduler.jobs.addJob({
          type: 'SurveyFeedbackNotification',
          userId,
          params: {
            surveyId,
            username,
            to: email,
            cc: copy === 'cc' && userEmail ? userEmail : undefined,
            bcc: copy === 'bcc' && userEmail ? userEmail : undefined,
          },
        });

        return { status: 200, body: undefined };
      },
    },
  });
}
