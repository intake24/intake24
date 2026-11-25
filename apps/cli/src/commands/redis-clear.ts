import type { RedisOptions } from '@intake24/api/config/redis';
import type { RedisStoreType } from '@intake24/common/types';

import { intro, log, outro } from '@clack/prompts';
import color from 'picocolors';

import cacheConfig from '@intake24/api/config/cache';
import rateLimiterConfig from '@intake24/api/config/rate-limiter';
import sessionConfig from '@intake24/api/config/session';
import RedisStore from '@intake24/api/services/core/redis/redis-store';
import { logger } from '@intake24/common-backend/services/logger';

// The API's store classes import the IoC container type, which pulls in API modules that rely on API-only ambient types (Express augmentations, @intake24/db/models).
class Store extends RedisStore {}

const storeConfigs: Record<RedisStoreType, RedisOptions> = {
  cache: cacheConfig.redis,
  rateLimiter: rateLimiterConfig.redis,
  session: sessionConfig.redis,
};

export type ClearRedisArgs = { store: RedisStoreType[] };

export default async ({ store: stores }: ClearRedisArgs): Promise<void> => {
  intro(color.cyan('Clear Redis stores'));

  for (const name of stores) {
    const store = new Store({ config: storeConfigs[name], logger });
    store.init();

    try {
      const cleared = await store.flush();
      log.success(cleared
        ? `${name}: cleared.`
        : `${name}: already empty.`);
    }
    finally {
      store.close();
    }
  }

  outro('Done.');
};
