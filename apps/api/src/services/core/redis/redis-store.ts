import type { RedisOptions } from '@intake24/api/config';
import type { Logger } from '@intake24/common-backend';

import { Redis } from 'ioredis';

export type RedisStoreOps = {
  config: RedisOptions;
  logger: Logger;
};

export default abstract class RedisStore {
  protected readonly config;

  protected readonly logger;

  protected redis!: Redis;

  constructor({ config, logger }: RedisStoreOps) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initialize Redis connection
   *
   * @returns {Redis}
   * @memberof RedisStore
   */
  init(): Redis {
    const { url, ...options } = this.config;
    this.redis = url ? new Redis(url, options) : new Redis(options);

    this.logger.info(`Redis connection (${this.constructor.name}) has been initialized.`);

    return this.redis;
  }

  /**
   * Close Redis connection
   *
   * @memberof RedisStore
   */
  close() {
    this.redis.disconnect();

    this.logger.info('Redis connection has been closed.');
  }

  /**
   * Flush redis store data
   *
   * @param {string} [pattern]
   * @returns {Promise<boolean>}
   * @memberof RedisStore
   */
  async flush(pattern = '*'): Promise<boolean> {
    const { keyPrefix } = this.config;

    const fullKeys = await this.redis.keys([keyPrefix ?? '', pattern].join(''));
    if (!fullKeys.length)
      return false;

    const keys = keyPrefix ? fullKeys.map(key => key.replace(keyPrefix, '')) : fullKeys;

    const result = await this.redis.del(keys);

    return !!result;
  }

  /**
   * Flush whole redis database
   * This includes other parts if system if using same redis instance:
   * 1) cache data
   * 2) queue data
   * 3) session data
   *
   * @returns {Promise<boolean>}
   * @memberof RedisStore
   */
  async flushdb(): Promise<boolean> {
    const result = await this.redis.flushdb();

    return !!result;
  }
}
