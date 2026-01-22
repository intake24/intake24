import { initContract } from '@ts-rest/core';
import { addYears, endOfDay } from 'date-fns';
import { z } from 'zod';

import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import { personalAccessTokenResponse } from '@intake24/common/types/http/admin';

const contract = initContract();

export const personalAccessToken = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/user/personal-access-tokens',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: personalAccessTokenResponse.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse user personal access tokens',
    description: 'Browse user personal access tokens (paginated)',
  },
  store: {
    method: 'POST',
    path: '/admin/user/personal-access-tokens',
    body: z.object({
      name: z.string().min(3).max(128),
      expiresAt: z.coerce
        .date()
        .min(new Date())
        .max(addYears(new Date(), 2))
        .transform(val => endOfDay(new Date(val))),
    }),
    responses: {
      200: z.object({
        jwt: z.string(),
        token: personalAccessTokenResponse,
      }),
    },
    summary: 'Issue personal access token',
    description: 'Issue new personal access token for user',
  },
  revoke: {
    method: 'DELETE',
    path: '/admin/user/personal-access-tokens/:tokenId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Revoke personal access token',
    description: 'Revoke personal access token for user',
  },
});
