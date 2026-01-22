import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString as languageId, paginationRequest } from '@intake24/common/types/http';
import {
  languageTranslationAttributes,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const languageTranslation = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/languages/:languageId/translations',
    pathParams: z.object({ languageId }),
    query: paginationRequest,
    responses: {
      200: languageTranslationAttributes.array(),
    },
    summary: 'Browse language translations',
    description: 'Browse language translations (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/languages/:languageId/translations',
    pathParams: z.object({ languageId }),
    body: null,
    responses: {
      201: languageTranslationAttributes.array(),
    },
    summary: 'Create language translations',
    description: 'Create new language translations',
  },
  update: {
    method: 'PUT',
    path: '/admin/languages/:languageId/translations',
    pathParams: z.object({ languageId }),
    body: z.object({
      translations: languageTranslationAttributes.pick({ id: true, messages: true }).array(),
    }),
    responses: {
      200: languageTranslationAttributes.array(),
    },
    summary: 'Update language translations',
    description: 'Update language translations by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/languages/:languageId/translations',
    pathParams: z.object({ languageId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete language translations',
    description: 'Delete language translations by id',
  },
  sync: {
    method: 'POST',
    path: '/admin/languages/:languageId/translations/sync',
    pathParams: z.object({ languageId }),
    body: null,
    responses: {
      201: languageTranslationAttributes.array(),
    },
    summary: 'Delete language translations',
    description: 'Delete language translations by id',
  },
});
