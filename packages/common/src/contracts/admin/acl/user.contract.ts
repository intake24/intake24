import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest, bigIntString as userId } from '@intake24/common/types/http';
import {
  userAttributes,
  userRefs,
  userRequest,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const user = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/users',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: userAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse users',
    description: 'Browse users (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/users',
    body: userRequest,
    responses: {
      201: userAttributes,
    },
    summary: 'Create user',
    description: 'Create new user',
  },
  refs: {
    method: 'GET',
    path: '/admin/users/refs',
    responses: {
      200: userRefs,
    },
    summary: 'User references',
    description: 'User reference data',
  },
  read: {
    method: 'GET',
    path: '/admin/users/:userId',
    pathParams: z.object({ userId }),
    responses: {
      200: userAttributes,
    },
    summary: 'Get user',
    description: 'Get user by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/users/:userId',
    pathParams: z.object({ userId }),
    body: userRequest,
    responses: {
      200: userAttributes,
    },
    summary: 'Update user',
    description: 'Update user by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/users/:userId',
    pathParams: z.object({ userId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete user',
    description: 'Delete user by id',
  },
  permissions: {
    method: 'GET',
    path: '/admin/users/:userId/permissions',
    pathParams: z.object({ userId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: userAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse assigned permissions',
    description: 'Browse assigned permissions (paginated list)',
  },
  roles: {
    method: 'GET',
    path: '/admin/users/:userId/roles',
    pathParams: z.object({ userId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: userAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse assigned roles',
    description: 'Browse assigned roles (paginated list)',
  },
});
