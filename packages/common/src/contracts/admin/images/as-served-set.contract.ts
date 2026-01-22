import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  asServedSetEntry,
  asServedSetListEntry,
  createAsServedSetRequest,
  updateAsServedSetInput,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const asServedSet = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/images/as-served-sets',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: asServedSetListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse as served sets',
    description: 'Browse as served sets (paginated list)',
  },
  store: {
    method: 'POST',
    contentType: 'multipart/form-data',
    path: '/admin/images/as-served-sets',
    body: createAsServedSetRequest,
    responses: {
      201: asServedSetEntry,
    },
    summary: 'Create as served set',
    description: 'Create new as served set',
  },
  read: {
    method: 'GET',
    path: '/admin/images/as-served-sets/:asServedSetId',
    responses: {
      200: asServedSetEntry,
    },
    summary: 'Get as served set',
    description: 'Get as served set by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/images/as-served-sets/:asServedSetId',
    body: updateAsServedSetInput,
    responses: {
      200: asServedSetEntry,
    },
    summary: 'Update as served set',
    description: 'Update as served set by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/images/as-served-sets/:asServedSetId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete as served set',
    description: 'Delete as served set by id',
  },
});
