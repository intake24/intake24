import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  standardUnitAttributes,
  standardUnitCategory,
  standardUnitFood,
  standardUnitRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const standardUnit = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/standard-units',
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
    path: '/admin/standard-units',
    body: standardUnitRequest,
    responses: {
      201: standardUnitAttributes,
    },
    summary: 'Create standard unit',
    description: 'Create new standard unit',
  },
  read: {
    method: 'GET',
    path: '/admin/standard-units/:standardUnitId',
    responses: {
      200: standardUnitAttributes,
    },
    summary: 'Get standard unit',
    description: 'Get standard unit by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/standard-units/:standardUnitId',
    body: standardUnitRequest.omit({ id: true }),
    responses: {
      200: standardUnitAttributes,
    },
    summary: 'Update standard unit',
    description: 'Update standard unit by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/standard-units/:standardUnitId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete standard unit',
    description: 'Delete standard unit by id',
  },
  categories: {
    method: 'GET',
    path: '/admin/standard-units/:standardUnitId/categories',
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
    path: '/admin/standard-units/:standardUnitId/foods',
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
