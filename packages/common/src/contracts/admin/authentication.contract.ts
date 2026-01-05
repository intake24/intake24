import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { mfaProviders } from '@intake24/common/security';
import { loginResponse } from '@intake24/common/types/http';
import { sanitize } from '../../rules';

export const authentication = initContract().router({
  login: {
    method: 'POST',
    path: '/admin/auth/login',
    headers: z.object({
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    }),
    body: z.object({
      email: z.string().toLowerCase(),
      password: z.string(),
    }),
    responses: {
      200: z.union([loginResponse, z.any()]),
    },
    summary: 'Admin login',
    description:
      'Login with email / password to admin interface. Response can differ based on whether multi-factor authentication is enabled or not.',
  },
  duo: {
    method: 'POST',
    path: '/admin/auth/duo',
    headers: z.object({
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    }),
    body: z.object({
      challengeId: z.string(),
      provider: z.enum(mfaProviders),
      token: z.string(),
    }),
    responses: {
      200: z.union([loginResponse, z.any()]),
    },
    summary: 'Verify Duo challenge',
    description: 'Verify Duo multi-factor authentication challenge',
  },
  fido: {
    method: 'POST',
    path: '/admin/auth/fido',
    headers: z.object({
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    }),
    body: z.object({
      challengeId: z.string(),
      provider: z.enum(mfaProviders),
      response: z.object({
        id: z.string(),
        rawId: z.string(),
        response: z.object({
          clientDataJSON: z.string(),
          authenticatorData: z.string(),
          signature: z.string(),
          userHandle: z.string().optional(),
        }),
        authenticatorAttachment: z
          .union([z.literal('cross-platform'), z.literal('platform')])
          .optional(),
        clientExtensionResults: z.object({
          appid: z.boolean().optional(),
          credProps: z.object({ rk: z.boolean().optional() }).optional(),
          hmacCreateSecret: z.boolean().optional(),
        }),
        type: z.literal('public-key'),
      }),
    }),
    responses: {
      200: z.union([loginResponse, z.any()]),
    },
    summary: 'Verify FIDO challenge',
    description: 'Verify FIDO multi-factor authentication challenge',
  },
  otp: {
    method: 'POST',
    path: '/admin/auth/otp',
    headers: z.object({
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    }),
    body: z.object({
      challengeId: z.string(),
      provider: z.enum(mfaProviders),
      token: z.string().length(6),
    }),
    responses: {
      200: z.union([loginResponse, z.any()]),
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
      200: z.undefined(),
    },
    summary: 'Logout from survey',
    description: 'Clears cookie which stores refresh token and revokes refresh token.',
  },
});
