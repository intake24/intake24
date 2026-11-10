import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Store } from 'express-rate-limit';

import type { RateLimit, RateLimitBucketName } from '@intake24/api/config';

import rateLimit from 'express-rate-limit';

export type BucketCount = 'all' | 'failures' | 'successes';

export type RateLimitMessage = 'generic' | 'login' | 'password' | 'verify' | 'generateUser' | 'feedback' | 'rating';

export type BucketOptions = {
  /**
   * Returning undefined means the bucket does not apply to the request.
   */
  key: (req: Request) => string | undefined;
  count: BucketCount;
  message: RateLimitMessage;
  skip?: (req: Request) => boolean;
  /**
   * Replaces the default 429 response when the limit is exceeded.
   */
  onLimitExceeded?: (req: Request, res: Response, next: NextFunction) => void;
};

export type BucketFactory = (name: RateLimitBucketName, options: BucketOptions) => RequestHandler;

export function createBucket(
  name: RateLimitBucketName,
  { windowMs, limit }: RateLimit,
  { key, count, message, skip, onLimitExceeded }: BucketOptions,
  store: Store,
): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests: count === 'failures',
    skipFailedRequests: count === 'successes',
    skip: req => ['127.0.0.1', '::1'].includes(req.ip ?? '') || !!skip?.(req) || key(req) === undefined,
    keyGenerator: (req) => {
      const value = key(req);
      if (value === undefined)
        throw new Error(`Rate limit bucket '${name}': key is not available for a request that was not skipped.`);

      return `${name}:${value}`;
    },
    handler: onLimitExceeded ?? ((req, res) => {
      res.status(429).json({
        message: req.scope.cradle.i18nService.translate(`rateLimit.${message}`),
      });
    }),
    legacyHeaders: false,
    standardHeaders: 'draft-7',
    store,
  });
}
