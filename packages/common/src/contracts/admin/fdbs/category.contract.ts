import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  categoryContentsResponse,
  categoryCopyInput,
  categoryEntry,
  categoryInput,
  categoryListEntry,
} from '@intake24/common/types/http/admin';

const contract = initContract();

const categoryId = bigIntString;
const localeId = bigIntString;

export const category = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/categories',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: categoryListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse categories',
    description: 'Browse categories (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/fdbs/:localeId/categories',
    body: categoryInput,
    pathParams: z.object({ localeId }),
    responses: {
      201: categoryEntry,
    },
    summary: 'Create category',
    description: 'Create new category in locale food database',
  },
  root: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/categories/root',
    pathParams: z.object({ localeId }),
    responses: {
      200: categoryListEntry.array(),
    },
    summary: 'Get root categories',
    description: 'Get root categories in the food database',
  },
  read: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/categories/:categoryId',
    pathParams: z.object({ localeId, categoryId }),
    responses: {
      200: categoryEntry,
    },
    summary: 'Get get food',
    description: 'Get food by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/fdbs/:localeId/categories/:categoryId',
    pathParams: z.object({ localeId, categoryId }),
    body: categoryInput,
    responses: {
      200: categoryEntry,
    },
    summary: 'Update locale',
    description: 'Update locale by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/fdbs/:localeId/categories/:categoryId',
    pathParams: z.object({ localeId, categoryId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete locale',
    description: 'Delete locale by id',
  },
  copy: {
    method: 'POST',
    path: '/admin/fdbs/:localeId/categories/:categoryId/copy',
    body: categoryCopyInput,
    pathParams: z.object({ localeId, categoryId }),
    responses: {
      201: categoryEntry,
    },
    summary: 'Copy category',
    description: 'Copy existing category in category database',
  },
  categories: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/categories/:categoryId/categories',
    pathParams: z.object({ localeId, categoryId }),
    responses: {
      200: z.string().array(),
    },
    summary: 'Get category categories',
    description: 'Get categories for a specific category in the category database',
  },
  contents: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/categories/:categoryId/contents',
    pathParams: z.object({ localeId, categoryId: z.literal('no-category').or(categoryId) }),
    responses: {
      200: categoryContentsResponse,
    },
    summary: 'Get category contents',
    description: 'Get contents for a specific category in the category database',
  },
});
