import type { Request } from 'express';

import type { RateLimit, RateLimitBucketName } from '@intake24/api/config';
import type { BucketFactory } from '@intake24/api/http/rate-limit';

import cookieParser from 'cookie-parser';
import express from 'express';
import { MemoryStore } from 'express-rate-limit';

import { createBucket } from '@intake24/api/http/rate-limit';

export function memoryBuckets(limits: Partial<Record<RateLimitBucketName, number>>): BucketFactory {
  return (name, options) => {
    const limit = limits[name];
    if (limit === undefined)
      throw new Error(`Missing test limit for bucket '${name}'`);

    const config: RateLimit = { windowMs: 60_000, limit };
    return createBucket(name, config, options, new MemoryStore());
  };
}

/**
 * Client IP is taken from X-Forwarded-For, the loopback address would be skipped by the limiter.
 */
export function testApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  app.use(cookieParser());
  app.use((req: Request, res, next) => {
    req.scope = {
      cradle: {
        i18nService: {
          translate: (key: string) => key,
        },
      },
    } as unknown as Request['scope'];
    next();
  });

  return app;
}
