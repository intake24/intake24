import z from 'zod';

import { parsedMsStringValue, validateConfig } from '@intake24/common-backend';

import { redisOptionsWithKeyPrefixSchema } from './redis';

export const rateLimitSchema = z.object({
  windowMs: parsedMsStringValue,
  limit: z.coerce.number().int().positive(),
});

export type RateLimit = z.infer<typeof rateLimitSchema>;

export const rateLimiterConfigSchema = z.object({
  redis: redisOptionsWithKeyPrefixSchema,
  deviceCookie: z.object({
    maxAge: parsedMsStringValue,
    maxEntries: z.coerce.number().int().positive(),
  }),
  limits: z.object({
    genericAnonymous: rateLimitSchema,
    genericSurveyUser: rateLimitSchema,
    genericAdminUser: rateLimitSchema,
    loginAccountIp: rateLimitSchema,
    loginAccount: rateLimitSchema,
    loginIp: rateLimitSchema,
    loginDevice: rateLimitSchema,
    passwordResetAccount: rateLimitSchema,
    passwordResetIp: rateLimitSchema,
    generateUserSurveyIp: rateLimitSchema,
    generateUserSurvey: rateLimitSchema,
    verify: rateLimitSchema,
    feedback: rateLimitSchema,
    rating: rateLimitSchema,
  }),
});

export type RateLimiterConfig = z.infer<typeof rateLimiterConfigSchema>;

export type RateLimitBucketName = keyof RateLimiterConfig['limits'];

const removedEnvVariables: Record<string, string[]> = {
  RATE_LIMITER_GENERIC_WINDOW: ['RATE_LIMITER_GENERIC_ANONYMOUS_WINDOW', 'RATE_LIMITER_GENERIC_SURVEY_USER_WINDOW', 'RATE_LIMITER_GENERIC_ADMIN_USER_WINDOW'],
  RATE_LIMITER_GENERIC_LIMIT: ['RATE_LIMITER_GENERIC_ANONYMOUS_LIMIT', 'RATE_LIMITER_GENERIC_SURVEY_USER_LIMIT', 'RATE_LIMITER_GENERIC_ADMIN_USER_LIMIT'],
  RATE_LIMITER_LOGIN_WINDOW: [
    'RATE_LIMITER_LOGIN_ACCOUNT_IP_WINDOW',
    'RATE_LIMITER_LOGIN_ACCOUNT_WINDOW',
    'RATE_LIMITER_LOGIN_IP_WINDOW',
    'RATE_LIMITER_LOGIN_DEVICE_WINDOW',
  ],
  RATE_LIMITER_LOGIN_LIMIT: [
    'RATE_LIMITER_LOGIN_ACCOUNT_IP_LIMIT',
    'RATE_LIMITER_LOGIN_ACCOUNT_LIMIT',
    'RATE_LIMITER_LOGIN_IP_LIMIT',
    'RATE_LIMITER_LOGIN_DEVICE_LIMIT',
  ],
  RATE_LIMITER_PASSWORD_WINDOW: ['RATE_LIMITER_PASSWORD_RESET_ACCOUNT_WINDOW', 'RATE_LIMITER_PASSWORD_RESET_IP_WINDOW'],
  RATE_LIMITER_PASSWORD_LIMIT: ['RATE_LIMITER_PASSWORD_RESET_ACCOUNT_LIMIT', 'RATE_LIMITER_PASSWORD_RESET_IP_LIMIT'],
  RATE_LIMITER_GEN_USER_WINDOW: ['RATE_LIMITER_GENERATE_USER_SURVEY_IP_WINDOW', 'RATE_LIMITER_GENERATE_USER_SURVEY_WINDOW'],
  RATE_LIMITER_GEN_USER_LIMIT: ['RATE_LIMITER_GENERATE_USER_SURVEY_IP_LIMIT', 'RATE_LIMITER_GENERATE_USER_SURVEY_LIMIT'],
};

export function assertNoRemovedEnvVariables(env: NodeJS.ProcessEnv) {
  const found = Object.entries(removedEnvVariables).filter(([name]) => env[name] !== undefined);
  if (!found.length)
    return;

  const details = found.map(([name, replacements]) => `  ${name} -> ${replacements.join(', ')}`).join('\n');
  throw new Error(
    `Rate limiter configuration: the following environment variables are no longer supported, replace them with the new ones -- check the .env file\n${details}\n`,
  );
}

assertNoRemovedEnvVariables(process.env);

const rawRateLimiterConfig = {
  redis: {
    url: process.env.RATE_LIMITER_REDIS_URL || process.env.REDIS_URL,
    host: process.env.RATE_LIMITER_REDIS_HOST || process.env.REDIS_HOST,
    port: process.env.RATE_LIMITER_REDIS_PORT || process.env.REDIS_PORT,
    db: process.env.RATE_LIMITER_REDIS_DATABASE || process.env.REDIS_DATABASE,
    keyPrefix: process.env.RATE_LIMITER_REDIS_PREFIX || 'it24:rate-limiter:',
  },
  deviceCookie: {
    maxAge: process.env.DEVICE_COOKIE_LIFETIME || '90d',
    maxEntries: process.env.DEVICE_COOKIE_MAX_ENTRIES || '5',
  },
  limits: {
    genericAnonymous: {
      windowMs: process.env.RATE_LIMITER_GENERIC_ANONYMOUS_WINDOW || '5m',
      limit: process.env.RATE_LIMITER_GENERIC_ANONYMOUS_LIMIT || '600',
    },
    genericSurveyUser: {
      windowMs: process.env.RATE_LIMITER_GENERIC_SURVEY_USER_WINDOW || '5m',
      limit: process.env.RATE_LIMITER_GENERIC_SURVEY_USER_LIMIT || '600',
    },
    genericAdminUser: {
      windowMs: process.env.RATE_LIMITER_GENERIC_ADMIN_USER_WINDOW || '5m',
      limit: process.env.RATE_LIMITER_GENERIC_ADMIN_USER_LIMIT || '1200',
    },
    loginAccountIp: {
      windowMs: process.env.RATE_LIMITER_LOGIN_ACCOUNT_IP_WINDOW || '15m',
      limit: process.env.RATE_LIMITER_LOGIN_ACCOUNT_IP_LIMIT || '5',
    },
    loginAccount: {
      windowMs: process.env.RATE_LIMITER_LOGIN_ACCOUNT_WINDOW || '15m',
      limit: process.env.RATE_LIMITER_LOGIN_ACCOUNT_LIMIT || '50',
    },
    loginIp: {
      windowMs: process.env.RATE_LIMITER_LOGIN_IP_WINDOW || '15m',
      limit: process.env.RATE_LIMITER_LOGIN_IP_LIMIT || '100',
    },
    loginDevice: {
      windowMs: process.env.RATE_LIMITER_LOGIN_DEVICE_WINDOW || '15m',
      limit: process.env.RATE_LIMITER_LOGIN_DEVICE_LIMIT || '10',
    },
    passwordResetAccount: {
      windowMs: process.env.RATE_LIMITER_PASSWORD_RESET_ACCOUNT_WINDOW || '1h',
      limit: process.env.RATE_LIMITER_PASSWORD_RESET_ACCOUNT_LIMIT || '3',
    },
    passwordResetIp: {
      windowMs: process.env.RATE_LIMITER_PASSWORD_RESET_IP_WINDOW || '1h',
      limit: process.env.RATE_LIMITER_PASSWORD_RESET_IP_LIMIT || '20',
    },
    generateUserSurveyIp: {
      windowMs: process.env.RATE_LIMITER_GENERATE_USER_SURVEY_IP_WINDOW || '5m',
      limit: process.env.RATE_LIMITER_GENERATE_USER_SURVEY_IP_LIMIT || '30',
    },
    generateUserSurvey: {
      windowMs: process.env.RATE_LIMITER_GENERATE_USER_SURVEY_WINDOW || '1h',
      limit: process.env.RATE_LIMITER_GENERATE_USER_SURVEY_LIMIT || '240',
    },
    verify: {
      windowMs: process.env.RATE_LIMITER_VERIFY_WINDOW || '5m',
      limit: process.env.RATE_LIMITER_VERIFY_LIMIT || '1',
    },
    feedback: {
      windowMs: process.env.RATE_LIMITER_FEEDBACK_WINDOW || '1m',
      limit: process.env.RATE_LIMITER_FEEDBACK_LIMIT || '1',
    },
    rating: {
      windowMs: process.env.RATE_LIMITER_RATING_WINDOW || '15m',
      limit: process.env.RATE_LIMITER_RATING_LIMIT || '1',
    },
  },
};

const parsedRateLimiterConfig = validateConfig('Rate limiter configuration', rateLimiterConfigSchema, rawRateLimiterConfig);

export default parsedRateLimiterConfig;
