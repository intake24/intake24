import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest, uuid as submissionId, bigIntString as surveyId } from '@intake24/common/types/http';
import {
  surveySubmissionAttributes,
  surveySubmissionListEntry,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const submission = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/submissions',
    pathParams: z.object({ surveyId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: surveySubmissionListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse submissions',
    description: 'Browse submissions (paginated list)',
  },
  read: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/submissions/:submissionId',
    pathParams: z.object({ surveyId, submissionId }),
    responses: {
      200: surveySubmissionAttributes,
    },
    summary: 'Get submission',
    description: 'Get submission by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/surveys/:surveyId/submissions/:submissionId',
    pathParams: z.object({ surveyId, submissionId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete submission',
    description: 'Delete submission by id',
  },
});
