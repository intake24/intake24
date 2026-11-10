import type { RedisReply } from 'rate-limit-redis';

import type { RateLimitBucketName } from '@intake24/api/config';
import type { BucketOptions } from '@intake24/api/http/rate-limit/bucket';
import type { IoC } from '@intake24/api/ioc';

import RedisStore from 'rate-limit-redis';

import { createBucket } from '@intake24/api/http/rate-limit/bucket';

import HasRedisClient from './redis-store';

export default class RateLimiter extends HasRedisClient {
  readonly limits;

  constructor({ rateLimiterConfig, logger }: Pick<IoC, 'rateLimiterConfig' | 'logger'>) {
    const { redis, limits } = rateLimiterConfig;
    super({
      config: redis,
      logger: logger.child({ service: 'RateLimiter' }),
    });

    this.limits = limits;
  }

  bucket = (name: RateLimitBucketName, options: BucketOptions) => createBucket(
    name,
    this.limits[name],
    options,
    new RedisStore({
      sendCommand: (command: string, ...args: string[]) => this.redis.call(command, ...args) as Promise<RedisReply>,
      prefix: this.config.keyPrefix,
    }),
  );
}
