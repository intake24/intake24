import z from 'zod';

import { validateConfig } from '@intake24/common-backend';

import { cookieSettings } from './common';
import { redisOptionsWithKeyPrefixSchema } from './redis';

export const sessionConfigSchema = z.object({
  redis: redisOptionsWithKeyPrefixSchema,
  cookie: cookieSettings,
});

export type SessionConfig = z.infer<typeof sessionConfigSchema>;

const rawSessionConfig = {
  redis: {
    url: process.env.SESSION_REDIS_URL || process.env.REDIS_URL,
    host: process.env.SESSION_REDIS_HOST || process.env.REDIS_HOST,
    port: process.env.SESSION_REDIS_PORT || process.env.REDIS_PORT,
    db: process.env.SESSION_REDIS_DATABASE || process.env.REDIS_DATABASE,
    keyPrefix: process.env.SESSION_REDIS_PREFIX || 'it24:session:',
  },
  cookie: {
    name: process.env.SESSION_COOKIE_NAME || 'it24_session',
    maxAge: process.env.SESSION_COOKIE_LIFETIME || '15m',
    httpOnly: true,
    path: process.env.SESSION_COOKIE_PATH || '/api/admin',
    sameSite: process.env.SESSION_COOKIE_SAME_SITE,
    secure: process.env.SESSION_COOKIE_SECURE,
  },
};

const parsedSessionConfig = validateConfig('Session configuration', sessionConfigSchema, rawSessionConfig);

export default parsedSessionConfig;
