import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { surveyTasks } from '@intake24/common/types';
import { paginationMeta, paginationRequest, bigIntString as surveyId } from '@intake24/common/types/http';
import {
  jobAttributes,
  surveyCreateRequest,
  surveyEntry,
  surveyListEntry,
  surveyPartialRequest,
  surveyRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const survey = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/surveys',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: surveyListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse surveys',
    description: 'Browse surveys (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/surveys',
    body: surveyCreateRequest,
    responses: {
      201: surveyEntry,
    },
    summary: 'Create survey',
    description: 'Create new survey',
  },
  read: {
    method: 'GET',
    path: '/admin/surveys/:surveyId',
    pathParams: z.object({ surveyId }),
    responses: {
      200: surveyEntry,
    },
    summary: 'Get survey',
    description: 'Get survey by id',
  },
  patch: {
    method: 'PATCH',
    path: '/admin/surveys/:surveyId',
    pathParams: z.object({ surveyId }),
    body: surveyPartialRequest,
    responses: {
      200: surveyEntry,
    },
    summary: 'Partial update survey',
    description: 'Partial update survey by id',
  },
  put: {
    method: 'PUT',
    path: '/admin/surveys/:surveyId',
    pathParams: z.object({ surveyId }),
    body: surveyRequest,
    responses: {
      200: surveyEntry,
    },
    summary: 'Update survey',
    description: 'Update survey by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/surveys/:surveyId',
    pathParams: z.object({ surveyId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete survey',
    description: 'Delete survey by id',
  },
  tasks: {
    method: 'POST',
    contentType: 'multipart/form-data',
    path: '/admin/surveys/:surveyId/tasks',
    body: surveyTasks,
    responses: {
      200: jobAttributes,
    },
    summary: 'Queue survey task',
    description:
      'Submits job to the queue.\nSpecific jobs can be submitted to the queue. Each job type has its own parameters. See job types for more information.',
  },
});
