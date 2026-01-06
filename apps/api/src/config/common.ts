import type { StringValue } from 'ms';
import ms from 'ms';
import z from 'zod';

export const msStringValue = z.custom<StringValue>(() => z.string().regex(/^\d+([smhdwy]|sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days|week|weeks|yr|yrs|year|years)$/));
export const parsedMsStringValue = msStringValue.transform(stringValue => ms(stringValue));

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
