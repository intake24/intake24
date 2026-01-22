import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest, bigIntString as permissionId } from '@intake24/common/types/http';
import {
  permissionAttributes,
  permissionRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const permission = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/permissions',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: permissionAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse permissions',
    description: 'Browse permissions (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/permissions',
    body: permissionRequest,
    responses: {
      201: permissionAttributes,
    },
    summary: 'Create permission',
    description: 'Create new permission',
  },
  read: {
    method: 'GET',
    path: '/admin/permissions/:permissionId',
    pathParams: z.object({ permissionId }),
    responses: {
      200: permissionAttributes,
    },
    summary: 'Get permission',
    description: 'Get permission by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/permissions/:permissionId',
    pathParams: z.object({ permissionId }),
    body: permissionRequest.omit({ name: true }),
    responses: {
      200: permissionAttributes,
    },
    summary: 'Update permission',
    description: 'Update permission by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/permissions/:permissionId',
    pathParams: z.object({ permissionId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete permission',
    description: 'Delete permission by id',
  },
  roles: {
    method: 'GET',
    path: '/admin/permissions/:permissionId/roles',
    pathParams: z.object({ permissionId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: permissionAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse assigned roles',
    description: 'Browse assigned permissions (paginated list)',
  },
  users: {
    method: 'GET',
    path: '/admin/permissions/:permissionId/users',
    pathParams: z.object({ permissionId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: permissionAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse assigned users',
    description: 'Browse assigned permissions (paginated list)',
  },
});
