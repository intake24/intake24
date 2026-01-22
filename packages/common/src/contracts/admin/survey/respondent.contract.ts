import { Readable } from 'node:stream';

import { initContract } from '@ts-rest/core';
import validator from 'validator';
import { z } from 'zod';

import { emailCopy } from '@intake24/common/types';
import { paginationMeta, paginationRequest, bigIntString as surveyId } from '@intake24/common/types/http';
import { createRespondentRequest, respondentEntry, respondentListEntry, respondentRequest } from '@intake24/common/types/http/admin';

const contract = initContract();

const pdfFeedbackRequest = z.object({
  lang: z.string().refine(val => validator.isLocale(val)).optional(),
  submissions: z.array(z.string().uuid()).optional(),
});

export const respondent = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/respondents',
    pathParams: z.object({ surveyId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: respondentListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse respondents',
    description: 'Browse survey respondents (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/surveys/:surveyId/respondents',
    pathParams: z.object({ surveyId }),
    body: createRespondentRequest,
    responses: {
      201: respondentEntry,
    },
    summary: 'Create respondent',
    description: 'Create new respondent',
  },
  read: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/respondents/:username',
    pathParams: z.object({ surveyId }),
    responses: {
      200: respondentEntry,
    },
    summary: 'Get respondent',
    description: 'Get survey respondent by username',
  },
  update: {
    method: 'PATCH',
    path: '/admin/surveys/:surveyId/respondents/:username',
    pathParams: z.object({ surveyId }),
    body: respondentRequest,
    responses: {
      200: respondentEntry,
    },
    summary: 'Update respondent',
    description: 'Update survey respondent by username',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/surveys/:surveyId/respondents/:username',
    pathParams: z.object({ surveyId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete respondent',
    description: 'Delete survey respondent by username',
  },
  downloadFeedback: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/respondents/:username/feedback',
    pathParams: z.object({ surveyId }),
    query: pdfFeedbackRequest,
    responses: {
      200: z.instanceof(Readable),
    },
    summary: 'Download feedback',
    description: 'Download feedback as PDF. Returns stream as application/pdf.',
  },
  emailFeedback: {
    method: 'POST',
    path: '/admin/surveys/:surveyId/respondents/:username/feedback',
    pathParams: z.object({ surveyId }),
    body: pdfFeedbackRequest.extend({
      email: z.string().email().toLowerCase(),
      copy: z.enum(emailCopy),
    }),
    responses: {
      200: contract.noBody(),
    },
    summary: 'Email respondent feedback',
    description: 'Email respondent feedback as PDF file attachment',
  },
});
