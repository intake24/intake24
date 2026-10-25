import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString } from '@intake24/common/types';
import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  standardUnitAttributes,
  standardUnitCategory,
  standardUnitFood,
  standardUnitRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

const localePath = z.object({ localeId: bigIntString });
const unitPath = z.object({ localeId: bigIntString, standardUnitId: bigIntString });

export const standardUnit = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/locales/:localeId/standard-units',
    pathParams: localePath,
    query: paginationRequest,
    responses: {
      200: z.object({
        data: standardUnitAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse standard units',
    description: 'Browse standard units (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/locales/:localeId/standard-units',
    pathParams: localePath,
    body: standardUnitRequest,
    responses: {
      201: standardUnitAttributes,
    },
    summary: 'Create standard unit',
    description: 'Create new standard unit',
  },
  read: {
    method: 'GET',
    path: '/admin/locales/:localeId/standard-units/:standardUnitId',
    pathParams: unitPath,
    responses: {
      200: standardUnitAttributes,
    },
    summary: 'Get standard unit',
    description: 'Get standard unit by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/locales/:localeId/standard-units/:standardUnitId',
    pathParams: unitPath,
    body: standardUnitRequest,
    responses: {
      200: standardUnitAttributes,
    },
    summary: 'Update standard unit',
    description: 'Update standard unit by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/locales/:localeId/standard-units/:standardUnitId',
    pathParams: unitPath,
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete standard unit',
    description: 'Delete standard unit by id',
  },
  categories: {
    method: 'GET',
    path: '/admin/locales/:localeId/standard-units/:standardUnitId/categories',
    pathParams: unitPath,
    query: paginationRequest,
    responses: {
      200: z.object({
        data: standardUnitCategory.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Standard unit categories',
    description: 'Get categories associated with standard unit',
  },
  foods: {
    method: 'GET',
    path: '/admin/locales/:localeId/standard-units/:standardUnitId/foods',
    pathParams: unitPath,
    query: paginationRequest,
    responses: {
      200: z.object({
        data: standardUnitFood.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Standard unit foods',
    description: 'Get foods associated with standard unit',
  },
});
