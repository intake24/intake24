import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { sanitize } from '../rules';
import { strongPasswordWithConfirm } from '../security';
import { captcha } from '../types/http';

const contract = initContract();

export const password = contract.router({
  request: {
    method: 'POST',
    path: '/password',
    headers: {
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    },
    body: z.object({
      email: z.string().email().toLowerCase(),
      captcha,
    }),
    responses: {
      200: contract.noBody(),
    },
    summary: 'Password request',
    description:
      'Request a password reset token to be sent by email. If captcha-protection activated, a captcha token has to be sent to validate the request.',
  },
  reset: {
    method: 'POST',
    path: '/password/reset',
    body: strongPasswordWithConfirm
      .extend({ email: z.string().email().toLowerCase(), token: z.string() })
      .refine(data => data.password === data.passwordConfirm, {
        message: 'Passwords don\'t match',
        path: ['passwordConfirm'],
      }),
    responses: {
      200: contract.noBody(),
    },
    summary: 'Password reset',
    description: 'Reset password using a token sent by email.',
  },
});
