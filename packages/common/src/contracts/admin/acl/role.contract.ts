import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest, bigIntString as roleId } from '@intake24/common/types/http';
import {
  roleAttributes,
  roleRefs,
  roleRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const role = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/roles',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: roleAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse roles',
    description: 'Browse roles (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/roles',
    body: roleRequest,
    responses: {
      201: roleAttributes,
    },
    summary: 'Create role',
    description: 'Create new role',
  },
  refs: {
    method: 'GET',
    path: '/admin/roles/refs',
    responses: {
      200: roleRefs,
    },
    summary: 'Role references',
    description: 'Role reference data',
  },
  read: {
    method: 'GET',
    path: '/admin/roles/:roleId',
    pathParams: z.object({ roleId }),
    responses: {
      200: roleAttributes,
    },
    summary: 'Get role',
    description: 'Get role by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/roles/:roleId',
    pathParams: z.object({ roleId }),
    body: roleRequest.omit({ name: true }),
    responses: {
      200: roleAttributes,
    },
    summary: 'Update role',
    description: 'Update role by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/roles/:roleId',
    pathParams: z.object({ roleId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete role',
    description: 'Delete role by id',
  },
  permissions: {
    method: 'GET',
    path: '/admin/roles/:roleId/permissions',
    pathParams: z.object({ roleId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: roleAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse assigned permissions',
    description: 'Browse assigned permissions (paginated list)',
  },
  users: {
    method: 'GET',
    path: '/admin/roles/:roleId/users',
    pathParams: z.object({ roleId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: roleAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse assigned users',
    description: 'Browse assigned users (paginated list)',
  },
});
