import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { paginationMeta, paginationRequest, uuid as sessionId, bigIntString as surveyId } from '@intake24/common/types/http';
import { userSurveySessionAttributes } from '@intake24/common/types/http/admin';

export const session = initContract().router({
  browse: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/sessions',
    pathParams: z.object({ surveyId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: userSurveySessionAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse respondent sessions',
    description: 'Browse respondent recall sessions (paginated list)',
  },
  read: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/sessions/:sessionId',
    pathParams: z.object({ surveyId, sessionId }),
    responses: {
      200: userSurveySessionAttributes,
    },
    summary: 'Get respondent session',
    description: 'Get respondent recall session by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/surveys/:surveyId/sessions/:sessionId',
    pathParams: z.object({ surveyId, sessionId }),
    body: null,
    responses: {
      204: z.undefined(),
    },
    summary: 'Delete respondent session',
    description: 'Delete respondent recall session by id',
  },
});
