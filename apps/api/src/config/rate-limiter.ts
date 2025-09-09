import type { Options } from 'express-rate-limit';
import type { RedisOptions } from './redis';
import ms from 'ms';
import { parseToMs } from '@intake24/common/util';

export type RateLimit = {
  windowMs: number;
  limit: number;
};

export type RateLimits = Record<
'generic' | 'login' | 'password' | 'verify' | 'generateUser' | 'feedback' | 'rating',
Partial<Options>
>;

export interface RateLimiterConfig extends RateLimits {
  redis: RedisOptions;
}

const rateLimiterConfig: RateLimiterConfig = {
  redis: {
    url: process.env.RATE_LIMITER_REDIS_URL || process.env.REDIS_URL || undefined,
    host: process.env.RATE_LIMITER_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.RATE_LIMITER_REDIS_PORT || process.env.REDIS_PORT || '6379', 10),
    db: Number.parseInt(process.env.RATE_LIMITER_REDIS_DATABASE || process.env.REDIS_DATABASE || '0', 10),
    keyPrefix: process.env.RATE_LIMITER_REDIS_PREFIX || 'it24:rate-limiter:',
  },
  generic: {
    windowMs: ms(parseToMs(process.env.RATE_LIMITER_GENERIC_WINDOW) || '5m'),
    limit: Number.parseInt(process.env.RATE_LIMITER_GENERIC_LIMIT || '300', 10),
  },
  login: {
    windowMs: ms(parseToMs(process.env.RATE_LIMITER_LOGIN_WINDOW) || '15m'),
    limit: Number.parseInt(process.env.RATE_LIMITER_LOGIN_LIMIT || '5', 10),
  },
  password: {
    windowMs: ms(parseToMs(process.env.RATE_LIMITER_PASSWORD_WINDOW) || '5m'),
    limit: Number.parseInt(process.env.RATE_LIMITER_PASSWORD_LIMIT || '1', 10),
  },
  verify: {
    windowMs: ms(parseToMs(process.env.RATE_LIMITER_VERIFY_WINDOW) || '5m'),
    limit: Number.parseInt(process.env.RATE_LIMITER_VERIFY_LIMIT || '1', 10),
  },
  generateUser: {
    windowMs: ms(parseToMs(process.env.RATE_LIMITER_GEN_USER_WINDOW) || '5m'),
    limit: Number.parseInt(process.env.RATE_LIMITER_GEN_USER_LIMIT || '1', 10),
  },
  feedback: {
    windowMs: ms(parseToMs(process.env.RATE_LIMITER_FEEDBACK_WINDOW) || '1m'),
    limit: Number.parseInt(process.env.RATE_LIMITER_FEEDBACK_LIMIT || '1', 10),
  },
  rating: {
    windowMs: ms(parseToMs(process.env.RATE_LIMITER_RATING_WINDOW) || '15m'),
    limit: Number.parseInt(process.env.RATE_LIMITER_RATING_LIMIT || '1', 10),
  },
};

export default rateLimiterConfig;
