import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString as feedbackSchemeId, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  feedbackSchemeCreateRequest,
  feedbackSchemeEntry,
  feedbackSchemePartialRequest,
  feedbackSchemeRefs,
  feedbackSchemeRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const feedbackScheme = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/feedback-schemes',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: feedbackSchemeEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse feedback schemes',
    description: 'Browse feedback schemes (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/feedback-schemes',
    body: feedbackSchemeCreateRequest,
    responses: {
      201: feedbackSchemeEntry,
    },
    summary: 'Create feedback scheme',
    description: 'Create new feedback scheme',
  },
  refs: {
    method: 'GET',
    path: '/admin/feedback-schemes/refs',
    responses: {
      200: feedbackSchemeRefs,
    },
    summary: 'Feedback scheme references',
    description: 'Get references for feedback scheme',
  },
  read: {
    method: 'GET',
    path: '/admin/feedback-schemes/:feedbackSchemeId',
    pathParams: z.object({ feedbackSchemeId }),
    responses: {
      200: feedbackSchemeEntry,
    },
    summary: 'Get feedback scheme',
    description: 'Get feedback scheme by id',
  },
  patch: {
    method: 'PATCH',
    path: '/admin/feedback-schemes/:feedbackSchemeId',
    pathParams: z.object({ feedbackSchemeId }),
    body: feedbackSchemePartialRequest,
    responses: {
      200: feedbackSchemeEntry,
    },
    summary: 'Partial update feedback scheme',
    description: 'Partial update feedback scheme by id',
  },
  put: {
    method: 'PUT',
    path: '/admin/feedback-schemes/:feedbackSchemeId',
    pathParams: z.object({ feedbackSchemeId }),
    body: feedbackSchemeRequest,
    responses: {
      200: feedbackSchemeEntry,
    },
    summary: 'Update feedback scheme',
    description: 'Update feedback scheme by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/feedback-schemes/:feedbackSchemeId',
    pathParams: z.object({ feedbackSchemeId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete feedback scheme',
    description: 'Delete feedback scheme by id',
  },
  copy: {
    method: 'POST',
    path: '/admin/feedback-schemes/:feedbackSchemeId/copy',
    pathParams: z.object({ feedbackSchemeId }),
    body: feedbackSchemeCreateRequest.pick({ name: true }),
    responses: {
      200: feedbackSchemeEntry,
    },
    summary: 'Copy feedback scheme',
    description: 'Copy feedback scheme record',
  },
});
