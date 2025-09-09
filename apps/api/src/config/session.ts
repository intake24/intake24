import type { CookieSettings, SameSiteCookieOptions } from './common';
import type { RedisOptions } from './redis';
import ms from 'ms';
import { parseToMs } from '@intake24/common/util';

export type SessionConfig = {
  redis: RedisOptions;
  cookie: CookieSettings;
};

const sessionConfig: SessionConfig = {
  redis: {
    url: process.env.SESSION_REDIS_URL || process.env.REDIS_URL || undefined,
    host: process.env.SESSION_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.SESSION_REDIS_PORT || process.env.REDIS_PORT || '6379', 10),
    db: Number.parseInt(process.env.SESSION_REDIS_DATABASE || process.env.REDIS_DATABASE || '0', 10),
    keyPrefix: process.env.SESSION_REDIS_PREFIX || 'it24:session:',
  },
  cookie: {
    name: process.env.SESSION_COOKIE_NAME || 'it24_session',
    maxAge: ms(parseToMs(process.env.SESSION_COOKIE_LIFETIME) || '15m'),
    httpOnly: true,
    path: process.env.SESSION_COOKIE_PATH || '/api/admin',
    sameSite: (process.env.SESSION_COOKIE_SAME_SITE || 'lax') as SameSiteCookieOptions,
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
  },
};

export default sessionConfig;
