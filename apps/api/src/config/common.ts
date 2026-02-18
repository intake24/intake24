import bytes from 'bytes';
import z from 'zod';

import { parsedMsStringValue } from '@intake24/common-backend/util';

export const parsedBytesStringValue = z.string().transform((stringValue, ctx) => {
  const parsed = bytes.parse(stringValue);
  if (parsed === null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Expected a value in bytes format (e.g., \'10MB\', \'1GB\', \'500KB\', \'1024\'). See https://github.com/visionmedia/bytes.js',
    });
    return z.NEVER;
  }
  return parsed;
});

export const sameSiteCookieOptions = ['strict', 'lax', 'none'] as const;
export type SameSiteCookieOptions = (typeof sameSiteCookieOptions)[number];

export const cookieSettings = z.object({
  name: z.string(),
  maxAge: parsedMsStringValue,
  httpOnly: z.boolean().or(z.stringbool()).default(true),
  path: z.string(),
  sameSite: z.enum(sameSiteCookieOptions).default('lax'),
  secure: z.boolean().or(z.stringbool()).default(false),
});
export type CookieSettings = z.infer<typeof cookieSettings>;
