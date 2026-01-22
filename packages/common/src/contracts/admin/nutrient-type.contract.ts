import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString as nutrientTypeId, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  nutrientTypeRefs,
  nutrientTypeRequest,
  nutrientTypeResponse,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const nutrientType = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/nutrient-types',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: nutrientTypeResponse.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse nutrient types',
    description: 'Browse nutrient types (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/nutrient-types',
    body: nutrientTypeRequest,
    responses: {
      201: nutrientTypeResponse,
    },
    summary: 'Create nutrient type',
    description: 'Create new nutrient type',
  },
  refs: {
    method: 'GET',
    path: '/admin/nutrient-types/refs',
    responses: {
      200: nutrientTypeRefs,
    },
    summary: 'Nutrient type references',
    description: 'Get references for nutrient types',
  },
  read: {
    method: 'GET',
    path: '/admin/nutrient-types/:nutrientTypeId',
    pathParams: z.object({ nutrientTypeId }),
    responses: {
      200: nutrientTypeResponse,
    },
    summary: 'Get nutrient type',
    description: 'Get nutrient type by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/nutrient-types/:nutrientTypeId',
    pathParams: z.object({ nutrientTypeId }),
    body: nutrientTypeRequest.omit({ id: true }),
    responses: {
      200: nutrientTypeResponse,
    },
    summary: 'Update nutrient type',
    description: 'Update nutrient type by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/nutrient-types/:nutrientTypeId',
    pathParams: z.object({ nutrientTypeId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete nutrient type',
    description: 'Delete nutrient type by id',
  },
});
