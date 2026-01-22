import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { localeTasks } from '@intake24/common/types';
import { bigIntString as localeId, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  jobAttributes,
  localeEntry,
  localeListEntry,
  localeRefs,
  localeRequest,
  updateLocaleRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const locale = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/locales',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: localeListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse locales',
    description: 'Browse locales (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/locales',
    body: localeRequest,
    responses: {
      201: localeEntry,
    },
    summary: 'Create locale',
    description: 'Create new locale',
  },
  refs: {
    method: 'GET',
    path: '/admin/locales/refs',
    responses: {
      200: localeRefs,
    },
    summary: 'Locale references',
    description: 'Get references for locale',
  },
  read: {
    method: 'GET',
    path: '/admin/locales/:localeId',
    pathParams: z.object({ localeId }),
    responses: {
      200: localeEntry,
    },
    summary: 'Get locale',
    description: 'Get locale by id',
  },
  getByCode: {
    method: 'GET',
    path: '/admin/locales/by-code/:code',
    pathParams: z.object({ code: z.string().min(1).max(64) }),
    responses: {
      200: localeEntry,
    },
    summary: 'Get locale by code',
    description: 'Get locale by code',
  },
  update: {
    method: 'PUT',
    path: '/admin/locales/:localeId',
    pathParams: z.object({ localeId }),
    body: updateLocaleRequest,
    responses: {
      200: localeEntry,
    },
    summary: 'Update locale',
    description: 'Update locale by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/locales/:localeId',
    pathParams: z.object({ localeId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete locale',
    description: 'Delete locale by id',
  },
  tasks: {
    method: 'POST',
    contentType: 'multipart/form-data',
    path: '/admin/locales/:localeId/tasks',
    body: localeTasks,
    responses: {
      200: jobAttributes,
    },
    summary: 'Queue locale task',
    description:
      'Submits job to the queue.\nSpecific jobs can be submitted to the queue. Each job type has its own parameters. See job types for more information.',
  },
});
