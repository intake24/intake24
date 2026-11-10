import type { Request } from 'express';

import { createHash } from 'node:crypto';

import { ipKeyGenerator } from 'express-rate-limit';
import z from 'zod';

const loginEmail = z.email().max(512).toLowerCase();
const surveySlug = z.string().min(1).max(128).toLowerCase();
const aliasUsername = z.string().min(1).max(256);

function hash(value: string) {
  return createHash('sha256').update(value).digest('base64url');
}

export function ipKey(req: Request): string {
  return req.ip
    ? ipKeyGenerator(req.ip)
    : 'missing-ip';
}

/**
 * Normalised the same way as the login contracts, so that letter case variants of the same email
 * share one key. Returns undefined for input that would fail request validation.
 */
export function emailAccountKey(email: unknown): string | undefined {
  const result = loginEmail.safeParse(email);
  return result.success
    ? hash(`email:${result.data}`)
    : undefined;
}

/**
 * Survey slugs are matched case-insensitively on login, aliases are matched exactly.
 */
export function aliasAccountKey(slug: unknown, username: unknown): string | undefined {
  const parsedSlug = surveySlug.safeParse(slug);
  const parsedUsername = aliasUsername.safeParse(username);
  if (!parsedSlug.success || !parsedUsername.success)
    return undefined;

  return hash(`alias:${parsedSlug.data}:${parsedUsername.data}`);
}

export function surveySlugKey(slug: unknown): string | undefined {
  const result = surveySlug.safeParse(slug);
  return result.success ? result.data : undefined;
}

/**
 * For routes behind authentication only, the user is registered by the ACL scope middleware.
 */
export function authenticatedUserKey(req: Request): string {
  return req.scope.cradle.user.userId;
}
