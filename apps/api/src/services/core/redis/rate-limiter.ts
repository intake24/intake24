import type { Request } from 'express';
import type { Options } from 'express-rate-limit';
import type { RedisReply } from 'rate-limit-redis';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import type { IoC } from '@intake24/api/ioc';
import type { TokenPayload } from '@intake24/common/security';
import HasRedisClient from './redis-store';

export default class RateLimiter extends HasRedisClient {
  readonly rateLimiters;

  constructor({ rateLimiterConfig, logger }: Pick<IoC, 'rateLimiterConfig' | 'logger'>) {
    const { redis, ...rest } = rateLimiterConfig;
    super({ config: redis, logger: logger.child({ service: 'RateLimiter' }) });

    this.rateLimiters = rest;
  }

  createMiddleware(type: keyof typeof this.rateLimiters, options: Partial<Options> = {}) {
    return rateLimit({
      handler: (req, res, next, { message, statusCode }) => {
        res
          .status(statusCode)
          .json({ message: typeof message === 'function' ? message(req, res) : message });
      },
      keyGenerator: req => `${type}:${(req.user as TokenPayload | undefined)?.userId ?? (req.ip ? ipKeyGenerator(req.ip) : 'missing-ip')}`,
      skip: req => ['127.0.0.1', '::1'].includes(req.ip ?? ''),
      message: (req: Request) => req.scope.cradle.i18nService.translate('rateLimit.generic'),
      legacyHeaders: false,
      standardHeaders: 'draft-7',
      ...this.rateLimiters[type],
      ...options,

      store: new RedisStore({
        sendCommand: (command: string, ...args: string[]) => this.redis.call(command, ...args) as Promise<RedisReply>,
        prefix: this.config.keyPrefix,
      }),
    });
  }

  createGenericMiddleware(type: string, options: Partial<Options> = {}) {
    return rateLimit({
      handler: (req, res, next, { message, statusCode }) => {
        res.status(statusCode).json({ message });
      },
      keyGenerator: req => `${type}:${(req.user as TokenPayload | undefined)?.userId ?? (req.ip ? ipKeyGenerator(req.ip) : 'missing-ip')}`,
      skip: req => ['127.0.0.1', '::1'].includes(req.ip ?? ''),
      legacyHeaders: false,
      standardHeaders: 'draft-7',
      ...options,

      store: new RedisStore({
        sendCommand: (command: string, ...args: string[]) => this.redis.call(command, ...args) as Promise<RedisReply>,
        prefix: this.config.keyPrefix,
      }),
    });
  }
}
