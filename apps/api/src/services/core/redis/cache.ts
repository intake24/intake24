/* eslint-disable ts/no-empty-object-type */
import type { StringValue } from 'ms';
import { mapValues } from 'lodash';
import ms from 'ms';
import stringify from 'safe-stable-stringify';

import type { IoC } from '@intake24/api/ioc';
import type { ACL_PAT_KEY, ACL_PERMISSIONS_KEY, ACL_ROLES_KEY } from '@intake24/common/security';
import { jsonDateReviver, mapKeys } from '@intake24/common/util';

import HasRedisClient from './redis-store';

export type CacheKeyPrefix
  = | typeof ACL_PAT_KEY
    | typeof ACL_PERMISSIONS_KEY
    | typeof ACL_ROLES_KEY
    | 'category-attributes'
    | 'category-all-categories'
    | 'category-parent-categories'
    | 'food-attributes'
    | 'food-entry'
    | 'food-all-categories'
    | 'food-all-category-codes'
    | 'food-parent-categories'
    | 'survey-search-settings'
    | 'user-submissions';
export type CacheKey
  = | `${CacheKeyPrefix}:${string}`
    | `${CacheKeyPrefix}:${string}:${string}`
    | 'feedback-data'
    | 'locales-index';
export type CacheValue = string | number | unknown[] | string[] | null | boolean | object;

export default class Cache extends HasRedisClient {
  constructor({ cacheConfig, logger }: Pick<IoC, 'cacheConfig' | 'logger'>) {
    super({ config: cacheConfig.redis, logger: logger.child({ service: 'Cache' }) });
  }

  /**
   * Retrieve item from cache by given key
   *
   * @template T
   * @param {CacheKey} key
   * @returns {(Promise<T | null>)}
   * @memberof Cache
   */
  async get<T>(key: CacheKey): Promise<T | null> {
    const data = await this.redis.get(key);

    return data ? (JSON.parse(data, jsonDateReviver) as T) : null;
  }

  /**
   * Retrieve multiple items.
   *
   * @template T
   * @param {string[]} keys to retrieve
   * @returns {(Promise<Record<string, T | null>>)} map of keys to cached values or
   * null if key is not set
   * @memberof Cache
   */
  async mget<T>(keys: CacheKey[]): Promise<(T | null)[]> {
    if (!keys.length)
      return [];

    const cached = await this.redis.mget(keys);
    return cached.map(item => (item ? (JSON.parse(item, jsonDateReviver) as T) : null));
  }

  /**
   * Check if item exists in cache
   *
   * @param {CacheKey} key
   * @returns {Promise<boolean>}
   * @memberof Cache
   */
  async has(key: CacheKey): Promise<boolean> {
    return !!(await this.redis.exists(key));
  }

  /**
   * Store item in cache, for given time optionally
   *
   * @param {CacheKey} key
   * @param {CacheValue} value
   * @param {(number | StringValue)} [ttl] expiration time in seconds or 'ms' string format
   * @returns {Promise<boolean>}
   * @memberof Cache
   */
  async set(key: CacheKey, value: CacheValue, ttl?: number | StringValue): Promise<boolean> {
    if (!ttl) {
      const result = await this.redis.set(key, stringify(value));
      return !!result;
    }

    const result = await this.redis.set(
      key,
      stringify(value),
      'PX',
      typeof ttl === 'string' ? ms(ttl) : ttl * 1000,
    );

    return !!result;
  }

  async setAdd(key: CacheKey, ...value: string[]): Promise<number> {
    return await this.redis.sadd(key, ...value);
  }

  async setMembers(key: CacheKey): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  /**
   * Store multiple items atomically.
   *
   * Uses Redis' mset feature unless an expiration time is provided, in which case
   * sets every item individually in a transaction (MULTI).
   *
   * @param {Record<string, CacheValue>} keyValues a record/object with key/value pairs
   * @param {(number | StringValue)} [ttl] expiration time in seconds or 'ms' string format
   * @returns {Promise<boolean>}
   * @memberof Cache
   */
  async mset(keyValues: Record<string, CacheValue>, ttl?: number | StringValue): Promise<boolean> {
    const serialised = mapValues(keyValues, v => stringify(v));

    if (!ttl) {
      const result = await this.redis.mset(keyValues);
      return !!result;
    }

    const tx = this.redis.multi();

    for (const kv of Object.entries(serialised))
      tx.set(kv[0], kv[1], 'PX', typeof ttl === 'string' ? ms(ttl) : ttl * 1000);

    const result = await tx.exec();

    return !!result;
  }

  /**
   * Remove item from cache
   *
   * @returns {Promise<boolean>}
   * @memberof Cache
   */
  async forget(key: CacheKey | CacheKey[]): Promise<boolean> {
    const keysToDelete = Array.isArray(key) ? key : [key];
    const result = await this.redis.del(keysToDelete);

    return !!result;
  }

  /**
   * Get data from cache if available
   * If not in cache, fresh data are fetched by provided callback stored in cache
   *
   *
   * @template T
   * @param {CacheKey} key
   * @param {(number | StringValue)} ttl expiration time in seconds or 'ms' string format
   * @param {() => Promise<T>} getData
   * @returns {Promise<T>}
   * @memberof Cache
   */
  async remember<T extends CacheValue>(
    key: CacheKey,
    ttl: number | StringValue,
    getData: () => Promise<T>,
  ): Promise<T> {
    const cachedData = await this.get<T>(key);
    if (cachedData !== null)
      return cachedData;

    const freshData = await getData();
    await this.set(key, freshData, ttl);

    return freshData;
  }

  /**
   * Get multiple items from cache if available.
   * If not in cache, getData callback is called for missing keys and the result it cached.
   *
   * @template T
   * @param {string[]} keys
   * @param {string} cacheKeyPrefix
   * @param {(number | StringValue)} ttl expiration time in seconds or 'ms' string format
   * @param {((keys: string[]) => Promise<Record<string, T | null>>)} getData
   * @returns {(Promise<Record<string, T | null>>)}
   * @memberof Cache
   */
  async rememberMany<T extends {}>(
    keys: string[],
    cacheKeyPrefix: CacheKeyPrefix,
    ttl: number | StringValue,
    getData: (keys: string[]) => Promise<Record<string, T | null>>,
  ): Promise<Record<string, T | null>> {
    if (!keys.length)
      return {};

    const cacheKeys = keys.map(k => `${cacheKeyPrefix}:${k}`) as CacheKey[];

    const cached = await this.mget<T>(cacheKeys);

    const keysToFetch = keys.filter((_, i) => cached[i] === null);

    const data = await getData(keysToFetch);

    await this.mset(
      mapKeys(data, k => `${cacheKeyPrefix}:${k}`) as Record<CacheKey, CacheValue>,
      ttl,
    );

    return Object.fromEntries(keys.map((k, i) => [k, cached[i] ?? data[k]]));
  }

  /**
   * Get data from cache if available
   * If not in cache, fresh data are fetched by provided callback stored in cache
   *
   * @template T
   * @param {string} key
   * @param {() => Promise<T>} getData
   * @returns {Promise<T>}
   * @memberof Cache
   */
  async rememberForever<T extends {}>(key: CacheKey, getData: () => Promise<T>): Promise<T> {
    const cachedData = await this.get<T>(key);
    if (cachedData !== null)
      return cachedData;

    const freshData = await getData();
    await this.set(key, freshData);

    return freshData;
  }

  async publish(channel: string, message: object) {
    await this.redis.publish(channel, JSON.stringify(message));
  }
}
