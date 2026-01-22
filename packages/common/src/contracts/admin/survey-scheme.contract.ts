import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest, bigIntString as surveySchemeId } from '@intake24/common/types/http';
import {
  surveySchemeCreateRequest,
  surveySchemeEntry,
  surveySchemeExportRefs,
  surveySchemePartialRequest,
  surveySchemeRefs,
  surveySchemeRequest,
  surveySchemeTemplates,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const surveyScheme = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/survey-schemes',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: surveySchemeEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse survey schemes',
    description: 'Browse survey schemes (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/survey-schemes',
    body: surveySchemeCreateRequest,
    responses: {
      201: surveySchemeEntry,
    },
    summary: 'Create survey scheme',
    description: 'Create new survey scheme',
  },
  refs: {
    method: 'GET',
    path: '/admin/survey-schemes/refs',
    responses: {
      200: surveySchemeRefs,
    },
    summary: 'Survey scheme references',
    description: 'Get references for survey scheme',
  },
  read: {
    method: 'GET',
    path: '/admin/survey-schemes/:surveySchemeId',
    pathParams: z.object({ surveySchemeId }),
    responses: {
      200: surveySchemeEntry,
    },
    summary: 'Get survey scheme',
    description: 'Get survey scheme by id',
  },
  patch: {
    method: 'PATCH',
    path: '/admin/survey-schemes/:surveySchemeId',
    pathParams: z.object({ surveySchemeId }),
    body: surveySchemePartialRequest,
    responses: {
      200: surveySchemeEntry,
    },
    summary: 'Partial update survey scheme',
    description: 'Partial update survey scheme by id',
  },
  put: {
    method: 'PUT',
    path: '/admin/survey-schemes/:surveySchemeId',
    pathParams: z.object({ surveySchemeId }),
    body: surveySchemeRequest,
    responses: {
      200: surveySchemeEntry,
    },
    summary: 'Update survey scheme',
    description: 'Update survey scheme by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/survey-schemes/:surveySchemeId',
    pathParams: z.object({ surveySchemeId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete survey scheme',
    description: 'Delete survey scheme by id',
  },
  copy: {
    method: 'POST',
    path: '/admin/survey-schemes/:surveySchemeId/copy',
    pathParams: z.object({ surveySchemeId }),
    body: surveySchemeCreateRequest.pick({ name: true }),
    responses: {
      200: surveySchemeEntry,
    },
    summary: 'Copy survey scheme',
    description: 'Copy survey scheme record',
  },
  templates: {
    method: 'GET',
    path: '/admin/survey-schemes/:surveySchemeId/templates',
    pathParams: z.object({ surveySchemeId }),
    query: paginationRequest,
    responses: {
      200: surveySchemeTemplates,
    },
    summary: 'Survey scheme templates',
    description: 'Survey scheme templates',
  },
  dataExportRefs: {
    method: 'GET',
    path: '/admin/survey-schemes/:surveySchemeId/data-export',
    pathParams: z.object({ surveySchemeId }),
    responses: {
      200: surveySchemeExportRefs,
    },
    summary: 'Survey scheme data export references',
    description: 'Get survey scheme data export references',
  },
});
