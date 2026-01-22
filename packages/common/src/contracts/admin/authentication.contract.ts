import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  adminAuthResponse,
  duoAuthenticationVerificationRequest,
  fidoAuthenticationVerificationRequest,
  loginResponse,
  mfaChallengeRequest,
  mfaChallengeResponse,
  otpAuthenticationVerificationRequest,
} from '@intake24/common/types/http';
import { sanitize } from '../../rules';

const contract = initContract();

export const authentication = contract.router({
  login: {
    method: 'POST',
    path: '/admin/auth/login',
    headers: {
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    },
    body: z.object({
      email: z.string().toLowerCase(),
      password: z.string(),
    }),
    responses: {
      200: adminAuthResponse,
    },
    summary: 'Admin login',
    description:
      'Login with email / password to admin interface. Response can differ based on whether multi-factor authentication is enabled or not.',
  },
  challenge: {
    method: 'POST',
    path: '/admin/auth/challenge',
    body: mfaChallengeRequest,
    responses: {
      200: mfaChallengeResponse,
    },
    summary: 'Request MFA challenge',
    description: 'Request multi-factor authentication challenge',
  },
  duo: {
    method: 'POST',
    path: '/admin/auth/duo',
    headers: {
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    },
    body: duoAuthenticationVerificationRequest,
    responses: {
      200: loginResponse,
    },
    summary: 'Verify Duo challenge',
    description: 'Verify Duo multi-factor authentication challenge',
  },
  fido: {
    method: 'POST',
    path: '/admin/auth/fido',
    headers: {
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    },
    body: fidoAuthenticationVerificationRequest,
    responses: {
      200: loginResponse,
    },
    summary: 'Verify FIDO challenge',
    description: 'Verify FIDO multi-factor authentication challenge',
  },
  otp: {
    method: 'POST',
    path: '/admin/auth/otp',
    headers: {
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    },
    body: otpAuthenticationVerificationRequest,
    responses: {
      200: loginResponse,
    },
    summary: 'Verify OTP challenge',
    description: 'Verify OTP multi-factor authentication challenge',
  },
  refresh: {
    method: 'POST',
    path: '/admin/auth/refresh',
    body: null,
    responses: {
      200: z.object({ accessToken: z.string() }),
    },
    summary: 'Refresh access token',
    description:
      'Refresh access token using refresh token. API server expects refresh token sent as cookie. Cookie name can differ based on API server configuration.',
  },
  logout: {
    method: 'POST',
    path: '/admin/auth/logout',
    body: null,
    responses: {
      200: contract.noBody(),
    },
    summary: 'Logout from survey',
    description: 'Clears cookie which stores refresh token and revokes refresh token.',
  },
});
