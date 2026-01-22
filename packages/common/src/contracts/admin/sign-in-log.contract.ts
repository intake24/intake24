import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest, bigIntString as signInLogId } from '@intake24/common/types/http';
import { signInLogAttributes } from '@intake24/common/types/http/admin';

const contract = initContract();

export const signInLog = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/sign-in-logs',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: signInLogAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse sign-in logs',
    description: 'Browse sign-in logs (paginated list)',
  },
  read: {
    method: 'GET',
    path: '/admin/sign-in-logs/:signInLogId',
    pathParams: z.object({ signInLogId }),
    responses: {
      200: signInLogAttributes,
    },
    summary: 'Get sign-in log',
    description: 'Get sign-in log by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/sign-in-logs/:signInLogId',
    pathParams: z.object({ signInLogId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete sign-in log',
    description: 'Delete sign-in log by id',
  },
});
