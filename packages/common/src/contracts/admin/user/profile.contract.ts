import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { adminUserProfile } from '@intake24/common/types/http/admin';

export const profile = initContract().router({
  profile: {
    method: 'GET',
    path: '/admin/user',
    responses: {
      200: adminUserProfile,
    },
    summary: 'User profile data',
    description: 'Get logged-in user profile data',
  },
  verify: {
    method: 'POST',
    path: '/admin/user/verify',
    body: null,
    responses: {
      200: z.undefined(),
    },
    summary: 'Verify user email',
    description: 'Request email verification link to be sent to user email',
  },
});
