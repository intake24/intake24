import { initContract } from '@ts-rest/core';

import {
  codeDeviceResponse,
  codeRegistrationChallenge,
  codeRegistrationVerificationRequest,
} from '@intake24/common/types/http/admin';

export const code = initContract().router({
  challenge: {
    method: 'GET',
    path: '/admin/user/mfa/providers/code',
    responses: {
      200: codeRegistrationChallenge,
    },
    summary: 'Code challenge',
    description: 'Generate a challenge for code multi-factor authentication',
  },
  verify: {
    method: 'POST',
    path: '/admin/user/mfa/providers/code',
    body: codeRegistrationVerificationRequest,
    responses: {
      200: codeDeviceResponse,
    },
    summary: 'Code verification',
    description: 'Verify code multi-factor authentication challenge',
  },
});
