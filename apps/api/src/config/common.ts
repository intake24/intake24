import type { StringValue } from 'ms';

import bytes from 'bytes';
import ms from 'ms';
import z from 'zod';

// Eslint offers incorrect replacement: this regex matches zero or one spaces but eslint wants to change it to " *" which matches any number of spaces.
// eslint-disable-next-line regexp/no-trivially-nested-quantifier
const msRegex = /^\d+(?: +)?(?:milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

export const msStringValue = z.custom<StringValue>(val => typeof val === 'string' && msRegex.test(val), 'Expected a value in vercel-ms format (e.g., \'30s\', \'1d\'). See https://github.com/vercel/ms');

export const parsedMsStringValue = msStringValue.transform(stringValue => ms(stringValue));

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
  httpOnly: z.boolean(),
  path: z.string(),
  sameSite: z.enum(sameSiteCookieOptions).default('lax'),
  secure: z.boolean(),
});
export type CookieSettings = z.infer<typeof cookieSettings>;
