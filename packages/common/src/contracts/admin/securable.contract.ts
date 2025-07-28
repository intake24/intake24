import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { securableDefs } from '@intake24/common/security';
import type { SecurableType } from '@intake24/common/security';
import { paginationMeta, paginationRequest, bigIntString as userId } from '@intake24/common/types/http';
import {
  createUserWithSecurables,
  updateSecurableOwnerRequest,
  userSecurableListEntry,
} from '@intake24/common/types/http/admin';

export function securable(securable: SecurableType, prefix: string) {
  return initContract().router({
    browse: {
      method: 'GET',
      path: `${prefix}/securables`,
      query: paginationRequest,
      responses: {
        200: z.object({
          data: userSecurableListEntry.array(),
          meta: paginationMeta,
        }),
      },
      summary: `${securable}: Browse securable users`,
      description: `${securable}: Browse securable users (paginated list)`,
    },
    store: {
      method: 'POST',
      path: `${prefix}/securables`,
      body: createUserWithSecurables.extend({
        actions: z.enum(securableDefs[securable]).array().min(1),
      }),
      responses: {
        201: z.undefined(),
      },
      summary: `${securable}: Create user for securable`,
      description: `${securable}: Create new user for securable`,
    },
    availableUsers: {
      method: 'GET',
      path: `${prefix}/securables/users`,
      query: paginationRequest,
      responses: {
        200: z.object({
          data: userSecurableListEntry.array(),
          meta: paginationMeta,
        }),
      },
      summary: `${securable}: Browse available users`,
      description: `${securable}: Browse available users (paginated list)`,
    },
    owner: {
      method: 'POST',
      path: `${prefix}/securables/owner`,
      body: updateSecurableOwnerRequest,
      responses: {
        201: z.undefined(),
      },
      summary: `${securable}: Set securable owner`,
      description: `${securable}: Set securable owner`,
    },
    update: {
      method: 'PATCH',
      path: `${prefix}/securables/:userId`,
      pathParams: z.object({ userId }),
      body: z.object({
        actions: z.enum(securableDefs[securable]).array().min(1),
      }),
      responses: {
        200: z.undefined(),
      },
      summary: `${securable}: Update user's securable access`,
      description: `${securable}: Update user's securable access`,
    },
    destroy: {
      method: 'DELETE',
      path: `${prefix}/securables/:userId`,
      pathParams: z.object({ userId }),
      body: null,
      responses: {
        204: z.undefined(),
      },
      summary: `${securable}: Remove user's securable access`,
      description: `${securable}: Remove user's securable access`,
    },
  });
}

export type SecurableContract = ReturnType<typeof securable>;
