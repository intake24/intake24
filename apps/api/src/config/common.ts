import type { StringValue } from 'ms';
import z from 'zod';

export const msStringValue = z.custom<StringValue>(() => z.string().regex(/^\d+([smhdwy]|sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days|week|weeks|yr|yrs|year|years)$/));

export const sameSiteCookieOptions = ['strict', 'lax', 'none'] as const;
export type SameSiteCookieOptions = (typeof sameSiteCookieOptions)[number];

export const cookieSettings = z.object({
  name: z.string(),
  maxAge: z.number().int().min(0),
  httpOnly: z.boolean(),
  path: z.string(),
  sameSite: z.enum(sameSiteCookieOptions).default('lax'),
  secure: z.boolean(),
});
export type CookieSettings = z.infer<typeof cookieSettings>;
