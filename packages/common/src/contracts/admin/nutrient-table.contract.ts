import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  nutrientTableTasks,
} from '@intake24/common/types';
import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  jobAttributes,
  nutrientTableRecordRequest,
  nutrientTableRefs,
  nutrientTableRequest,
  nutrientTableResponse,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const nutrientTable = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/nutrient-tables',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: nutrientTableResponse.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse nutrient tables',
    description: 'Browse nutrient tables (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/nutrient-tables',
    body: nutrientTableRequest,
    responses: {
      201: nutrientTableResponse,
    },
    summary: 'Create nutrient table',
    description: 'Create new nutrient table',
  },
  refs: {
    method: 'GET',
    path: '/admin/nutrient-tables/refs',
    responses: {
      200: nutrientTableRefs,
    },
    summary: 'Nutrient table references',
    description: 'Get references for nutrient tables',
  },
  read: {
    method: 'GET',
    path: '/admin/nutrient-tables/:nutrientTableId',
    responses: {
      200: nutrientTableResponse,
    },
    summary: 'Get nutrient table',
    description: 'Get nutrient table by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/nutrient-tables/:nutrientTableId',
    body: nutrientTableRequest.omit({ id: true }),
    responses: {
      200: nutrientTableResponse,
    },
    summary: 'Update nutrient table',
    description: 'Update nutrient table by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/nutrient-tables/:nutrientTableId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete nutrient table',
    description: 'Delete nutrient table by id',
  },
  tasks: {
    method: 'POST',
    contentType: 'multipart/form-data',
    path: '/admin/nutrient-tables/:nutrientTableId/tasks',
    body: nutrientTableTasks,
    responses: {
      200: jobAttributes,
    },
    summary: 'Queue nutrient table task',
    description:
      'Submits job to the queue.\nSpecific jobs can be submitted to the queue. Each job type has its own parameters. See job types for more information.',
  },
  records: {
    method: 'PUT',
    path: '/admin/nutrient-tables/:nutrientTableId/records',
    body: z.object({
      records: nutrientTableRecordRequest.array(),
    }),
    responses: {
      200: contract.noBody(),
    },
    summary: 'Update nutrient table records',
    description: 'Update nutrient table records by id',
  },
});
