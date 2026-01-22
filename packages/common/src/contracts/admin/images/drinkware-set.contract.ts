import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  createDrinkwareSetInput,
  drinkwareSetEntry,
  drinkwareSetListEntry,
  updateDrinkwareSetInput,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const drinkwareSet = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/images/drinkware-sets',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: drinkwareSetListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse drinkware sets',
    description: 'Browse drinkware sets (paginated list)',
  },
  store: {
    method: 'POST',
    contentType: 'multipart/form-data',
    path: '/admin/images/drinkware-sets',
    body: createDrinkwareSetInput,
    responses: {
      201: drinkwareSetEntry,
    },
    summary: 'Create drinkware set',
    description: 'Create new drinkware set',
  },
  read: {
    method: 'GET',
    path: '/admin/images/drinkware-sets/:drinkwareSetId',
    responses: {
      200: drinkwareSetEntry,
    },
    summary: 'Get drinkware set',
    description: 'Get drinkware set by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/images/drinkware-sets/:drinkwareSetId',
    body: updateDrinkwareSetInput,
    responses: {
      200: drinkwareSetEntry,
    },
    summary: 'Update drinkware set',
    description: 'Update drinkware set by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/images/drinkware-sets/:drinkwareSetId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete drinkware set',
    description: 'Delete drinkware set by id',
  },
});
