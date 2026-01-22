import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest, bigIntString as taskId } from '@intake24/common/types/http';
import {
  jobAttributes,
  taskAttributes,
  taskRequest,
  taskResponse,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const task = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/tasks',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: taskAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse tasks',
    description: 'Browse tasks (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/tasks',
    body: taskRequest,
    responses: {
      201: taskAttributes,
    },
    summary: 'Create task',
    description: 'Create new task',
  },
  read: {
    method: 'GET',
    path: '/admin/tasks/:taskId',
    pathParams: z.object({ taskId }),
    responses: {
      200: taskResponse,
    },
    summary: 'Get task',
    description: 'Get task by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/tasks/:taskId',
    pathParams: z.object({ taskId }),
    body: taskRequest,
    responses: {
      200: taskResponse,
    },
    summary: 'Update task',
    description: 'Update task by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/tasks/:taskId',
    pathParams: z.object({ taskId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete task',
    description: 'Delete task by id',
  },
  run: {
    method: 'POST',
    path: '/admin/tasks/:taskId/run',
    pathParams: z.object({ taskId }),
    body: null,
    responses: {
      200: jobAttributes,
    },
    summary: 'Run task',
    description: 'Trigger task pushing into the job queue',
  },
});
