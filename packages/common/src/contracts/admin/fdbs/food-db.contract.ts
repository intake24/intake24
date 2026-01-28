import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString as localeId, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  foodDatabaseRefs,
  localeEntry,
} from '@intake24/common/types/http/admin';

export const foodDb = initContract().router({
  browse: {
    method: 'GET',
    path: '/admin/fdbs',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: localeEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse food lists',
    description: 'Browse food lists (paginated list)',
  },
  refs: {
    method: 'GET',
    path: '/admin/fdbs/refs',
    responses: {
      200: foodDatabaseRefs,
    },
    summary: 'Get food list references',
    description: 'Get food list references',
  },
  read: {
    method: 'GET',
    path: '/admin/fdbs/:localeId',
    pathParams: z.object({ localeId }),
    responses: {
      200: localeEntry,
    },
    summary: 'Get food list',
    description: 'Get food list by id',
  },
});
