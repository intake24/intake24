import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  asServedImageEntry,
  createAsServedImageRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const asServedImage = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/images/as-served-sets/:asServedSetId/images',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: asServedImageEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse as served images',
    description: 'Browse as served images (paginated list)',
  },
  store: {
    method: 'POST',
    contentType: 'multipart/form-data',
    path: '/admin/images/as-served-sets/:asServedSetId/images',
    body: createAsServedImageRequest,
    responses: {
      201: asServedImageEntry,
    },
    summary: 'Create as served image',
    description: 'Create new as served image',
  },
  destroyAll: {
    method: 'DELETE',
    path: '/admin/images/as-served-sets/:asServedSetId/images',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete as served images',
    description: 'Delete all as served image of as served set',
  },
  read: {
    method: 'GET',
    path: '/admin/images/as-served-sets/:asServedSetId/images/:asServedImageId',
    responses: {
      200: asServedImageEntry,
    },
    summary: 'Get as served image',
    description: 'Get as served image by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/images/as-served-sets/:asServedSetId/images/:asServedImageId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete as served image',
    description: 'Delete as served image by id',
  },
});
