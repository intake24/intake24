import type { Options } from 'express-rate-limit';

import z from 'zod';

import { parsedMsStringValue } from './common';
import { redisOptionsWithKeyPrefixSchema } from './redis';
import { validateConfig } from './validate-config';

export const rateLimitSchema = z.object({
  windowMs: parsedMsStringValue,
  limit: z.coerce.number().int().positive(),
});

export type RateLimit = z.infer<typeof rateLimitSchema>;

export const rateLimiterConfigSchema = z.object({
  redis: redisOptionsWithKeyPrefixSchema,
  generic: rateLimitSchema,
  login: rateLimitSchema,
  password: rateLimitSchema,
  verify: rateLimitSchema,
  generateUser: rateLimitSchema,
  feedback: rateLimitSchema,
  rating: rateLimitSchema,
});

export type RateLimiterConfig = z.infer<typeof rateLimiterConfigSchema> & { [key: string]: Partial<Options> };

const rawRateLimiterConfig = {
  redis: {
    url: process.env.RATE_LIMITER_REDIS_URL || process.env.REDIS_URL || undefined,
    host: process.env.RATE_LIMITER_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: process.env.RATE_LIMITER_REDIS_PORT || process.env.REDIS_PORT || '6379',
    db: process.env.RATE_LIMITER_REDIS_DATABASE || process.env.REDIS_DATABASE || '0',
    keyPrefix: process.env.RATE_LIMITER_REDIS_PREFIX || 'it24:rate-limiter:',
  },
  generic: {
    windowMs: process.env.RATE_LIMITER_GENERIC_WINDOW || '5m',
    limit: process.env.RATE_LIMITER_GENERIC_LIMIT || '300',
  },
  login: {
    windowMs: process.env.RATE_LIMITER_LOGIN_WINDOW || '15m',
    limit: process.env.RATE_LIMITER_LOGIN_LIMIT || '5',
  },
  password: {
    windowMs: process.env.RATE_LIMITER_PASSWORD_WINDOW || '5m',
    limit: process.env.RATE_LIMITER_PASSWORD_LIMIT || '1',
  },
  verify: {
    windowMs: process.env.RATE_LIMITER_VERIFY_WINDOW || '5m',
    limit: process.env.RATE_LIMITER_VERIFY_LIMIT || '1',
  },
  generateUser: {
    windowMs: process.env.RATE_LIMITER_GEN_USER_WINDOW || '5m',
    limit: process.env.RATE_LIMITER_GEN_USER_LIMIT || '1',
  },
  feedback: {
    windowMs: process.env.RATE_LIMITER_FEEDBACK_WINDOW || '1m',
    limit: process.env.RATE_LIMITER_FEEDBACK_LIMIT || '1',
  },
  rating: {
    windowMs: process.env.RATE_LIMITER_RATING_WINDOW || '15m',
    limit: process.env.RATE_LIMITER_RATING_LIMIT || '1',
  },
};

const parsedRateLimiterConfig = validateConfig('Rate limiter configuration', rateLimiterConfigSchema, rawRateLimiterConfig);

export default parsedRateLimiterConfig;
