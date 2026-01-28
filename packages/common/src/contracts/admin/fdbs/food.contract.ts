import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  foodCopyInput,
  foodEntry,
  foodInput,
  foodListEntry,
} from '@intake24/common/types/http/admin';

const contract = initContract();

const foodId = bigIntString;
const localeId = bigIntString;

export const food = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/foods',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: foodListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse foods',
    description: 'Browse foods (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/fdbs/:localeId/foods',
    body: foodInput,
    pathParams: z.object({ localeId }),
    responses: {
      201: foodEntry,
    },
    summary: 'Create food',
    description: 'Create new food in locale food database',
  },
  getByCode: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/foods/by-code/:code',
    pathParams: z.object({ localeId, code: z.string().min(1).max(64) }),
    responses: {
      200: foodEntry,
    },
    summary: 'Get food by code',
    description: 'Get food by code',
  },
  read: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/foods/:foodId',
    pathParams: z.object({ localeId, foodId }),
    responses: {
      200: foodEntry,
    },
    summary: 'Get get food',
    description: 'Get food by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/fdbs/:localeId/foods/:foodId',
    pathParams: z.object({ localeId, foodId }),
    body: foodInput,
    responses: {
      200: foodEntry,
    },
    summary: 'Update food',
    description: 'Update food by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/fdbs/:localeId/foods/:foodId',
    pathParams: z.object({ localeId, foodId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete food',
    description: 'Delete food by id',
  },
  copy: {
    method: 'POST',
    path: '/admin/fdbs/:localeId/foods/:foodId/copy',
    body: foodCopyInput,
    pathParams: z.object({ localeId, foodId }),
    responses: {
      201: foodEntry,
    },
    summary: 'Copy food',
    description: 'Copy existing food in food database',
  },
  categories: {
    method: 'GET',
    path: '/admin/fdbs/:localeId/foods/:foodId/categories',
    pathParams: z.object({ localeId, foodId }),
    responses: {
      200: z.string().array(),
    },
    summary: 'Get food categories',
    description: 'Get categories for a specific food in the food database',
  },
});
