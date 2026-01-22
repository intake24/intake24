import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest, bigIntString as surveySchemePromptId } from '@intake24/common/types/http';
import {
  surveySchemePromptAttributes,
  surveySchemePromptRefs,
  surveySchemePromptRequest,
  surveySchemePromptSyncRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const surveySchemePrompt = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/survey-scheme-prompts',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: surveySchemePromptAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse survey scheme prompts',
    description: 'Browse survey scheme prompts (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/survey-scheme-prompts',
    body: surveySchemePromptRequest,
    responses: {
      201: surveySchemePromptAttributes,
    },
    summary: 'Create survey scheme prompt',
    description: 'Create new survey scheme prompt',
  },
  refs: {
    method: 'GET',
    path: '/admin/survey-scheme-prompts/refs',
    responses: {
      200: surveySchemePromptRefs,
    },
    summary: 'survey scheme prompt references',
    description: 'Get references for survey scheme prompt',
  },
  read: {
    method: 'GET',
    path: '/admin/survey-scheme-prompts/:surveySchemePromptId',
    pathParams: z.object({ surveySchemePromptId }),
    responses: {
      200: surveySchemePromptAttributes,
    },
    summary: 'Get survey scheme prompt',
    description: 'Get survey scheme prompt by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/survey-scheme-prompts/:surveySchemePromptId',
    pathParams: z.object({ surveySchemePromptId }),
    body: surveySchemePromptRequest,
    responses: {
      200: surveySchemePromptAttributes,
    },
    summary: 'Update survey scheme prompt',
    description: 'Update survey scheme prompt by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/survey-scheme-prompts/:surveySchemePromptId',
    pathParams: z.object({ surveySchemePromptId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete survey scheme prompt',
    description: 'Delete survey scheme prompt by id',
  },
  sync: {
    method: 'POST',
    path: '/admin/survey-scheme-prompts/:surveySchemePromptId/sync',
    pathParams: z.object({ surveySchemePromptId }),
    body: surveySchemePromptSyncRequest,
    responses: {
      200: contract.noBody(),
    },
    summary: 'Sync survey scheme prompt',
    description: 'Synchronize survey scheme prompt record',
  },
});
