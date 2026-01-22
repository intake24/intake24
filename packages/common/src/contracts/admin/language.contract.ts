import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString as languageId, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  languageAttributes,
  languageEntry,
  languageRequest,
  updateLanguageRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const language = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/languages',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: languageAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse languages',
    description: 'Browse languages (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/languages',
    body: languageRequest,
    responses: {
      201: languageEntry,
    },
    summary: 'Create language',
    description: 'Create new language',
  },
  read: {
    method: 'GET',
    path: '/admin/languages/:languageId',
    pathParams: z.object({ languageId }),
    responses: {
      200: languageEntry,
    },
    summary: 'Get language',
    description: 'Get language by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/languages/:languageId',
    pathParams: z.object({ languageId }),
    body: updateLanguageRequest,
    responses: {
      200: languageEntry,
    },
    summary: 'Update language',
    description: 'Update language by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/languages/:languageId',
    pathParams: z.object({ languageId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete language',
    description: 'Delete language by id',
  },
});
