import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString as nutrientUnitId, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import { nutrientUnitAttributes, nutrientUnitRequest } from '@intake24/common/types/http/admin';

const contract = initContract();

export const nutrientUnit = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/nutrient-units',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: nutrientUnitAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse nutrient units',
    description: 'Browse nutrient units (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/nutrient-units',
    body: nutrientUnitRequest,
    responses: {
      201: nutrientUnitAttributes,
    },
    summary: 'Create nutrient unit',
    description: 'Create new nutrient unit',
  },
  read: {
    method: 'GET',
    path: '/admin/nutrient-units/:nutrientUnitId',
    pathParams: z.object({ nutrientUnitId }),
    responses: {
      200: nutrientUnitAttributes,
    },
    summary: 'Get nutrient unit',
    description: 'Get nutrient unit by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/nutrient-units/:nutrientUnitId',
    pathParams: z.object({ nutrientUnitId }),
    body: nutrientUnitRequest.omit({ id: true }),
    responses: {
      200: nutrientUnitAttributes,
    },
    summary: 'Update nutrient unit',
    description: 'Update nutrient unit by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/nutrient-units/:nutrientUnitId',
    pathParams: z.object({ nutrientUnitId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete nutrient unit',
    description: 'Delete nutrient unit by id',
  },
});
