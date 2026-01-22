import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { strongPasswordWithConfirm } from '@intake24/common/security';
import { captcha, loginResponse } from '@intake24/common/types/http';
import { sanitize } from '../../rules';

const contract = initContract();

export const signUp = contract.router({
  signUp: {
    method: 'POST',
    path: '/admin/sign-up',
    headers: {
      'user-agent': z.string().optional().transform(val => sanitize(val)),
    },
    body: strongPasswordWithConfirm
      .extend({
        email: z.string().max(512).email().toLowerCase(),
        emailConfirm: z.string().email().toLowerCase(),
        name: z.string().min(3).max(512),
        phone: z.string().max(32).nullish(),
        terms: z.literal(true),
        captcha,
      })
      .superRefine((data, ctx) => {
        if (data.email !== data.emailConfirm) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['emailConfirm'],
            message: `Emails do not match`,
          });
        }

        if (data.email !== data.emailConfirm) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['passwordConfirm'],
            message: `Passwords do not match`,
          });
        }
      }),
    responses: {
      200: z.union([loginResponse, z.any()]),
    },
    summary: 'Admin sign-up',
    description: 'Register account for admin interface',
  },
  verify: {
    method: 'POST',
    path: '/admin/sign-up/verify',
    body: z.object({
      token: z.string().jwt(),
    }),
    responses: {
      200: contract.noBody(),
    },
    summary: 'Admin email verification',
    description: 'Verify email address for admin account',
  },
});
