import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { auditLog, auditTablesRequest, auditTablesResponse } from '@intake24/common/types/http/admin';

const contract = initContract();

export const audit = contract.router({
  getSettings: {
    method: 'GET',
    path: '/admin/audit/tables',
    responses: {
      200: auditTablesResponse,
    },
    summary: 'Audit settings',
    description: 'Get the audit settings for the specified database',
  },
  saveSettings: {
    method: 'POST',
    path: '/admin/audit/tables',
    body: auditTablesRequest,
    responses: {
      200: auditTablesResponse,
    },
    summary: 'Save audit settings',
    description: 'Save the audit settings for the specified database',
  },
  resource: {
    method: 'GET',
    path: '/admin/audit/log/:resource/:resourceId',
    pathParams: z.object({
      resource: z.string(),
      resourceId: z.string(),
    }),
    responses: {
      200: auditLog,
    },
    summary: 'Resource audit',
    description: 'Audit the specified resource',
  },
  subResource: {
    method: 'GET',
    path: '/admin/audit/log/:resource/:resourceId/:subResource/:subResourceId',
    pathParams: z.object({
      resource: z.string(),
      resourceId: z.string(),
      subResource: z.string(),
      subResourceId: z.string(),
    }),
    responses: {
      200: auditLog,
    },
    summary: 'Sub-resource audit',
    description: 'Audit the specified sub-resource',
  },
});
