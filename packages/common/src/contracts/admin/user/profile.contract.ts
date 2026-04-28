import { initContract } from '@ts-rest/core';

import { adminUserProfile, updateUserProfile } from '@intake24/common/types/http/admin';

const contract = initContract();

export const profile = contract.router({
  profile: {
    method: 'GET',
    path: '/admin/user',
    responses: {
      200: adminUserProfile,
    },
    summary: 'User profile data',
    description: 'Get logged-in user profile data',
  },
  update: {
    method: 'PATCH',
    path: '/admin/user',
    body: updateUserProfile,
    responses: {
      200: contract.noBody(),
    },
    summary: 'Update profile data',
    description: 'Update user profile data',
  },
  verify: {
    method: 'POST',
    path: '/admin/user/verify',
    body: null,
    responses: {
      200: contract.noBody(),
    },
    summary: 'Verify user email',
    description: 'Request email verification link to be sent to user email',
  },
});
