import type { IoC } from '@intake24/api/ioc';

import HasRedisClient from './redis-store';

export default class Session extends HasRedisClient {
  constructor({ sessionConfig, logger }: Pick<IoC, 'sessionConfig' | 'logger'>) {
    super({
      config: sessionConfig.redis,
      logger: logger.child({ service: 'Session' }),
    });
  }
}
