import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { auditHistory } from '@intake24/common/types/http/admin';

const contract = initContract();

export const audit = contract.router({
  resource: {
    method: 'GET',
    path: '/admin/audit/:resource/:resourceId',
    pathParams: z.object({
      resource: z.string(),
      resourceId: z.string(),
    }),
    responses: {
      200: auditHistory,
    },
    summary: 'Resource audit',
    description: 'Audit the specified resource',
  },
  subResource: {
    method: 'GET',
    path: '/admin/audit/:resource/:resourceId/:subResource/:subResourceId',
    pathParams: z.object({
      resource: z.string(),
      resourceId: z.string(),
      subResource: z.string(),
      subResourceId: z.string(),
    }),
    responses: {
      200: auditHistory.array(),
    },
    summary: 'Sub-resource audit',
    description: 'Audit the specified sub-resource',
  },
});
