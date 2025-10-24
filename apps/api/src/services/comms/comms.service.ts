import type { IoC } from '@intake24/api/ioc';
import { CommsList, SubscribeInput } from './comms';

function commsService({ commsProvider, logger: globalLogger }: Pick<IoC, 'commsProvider' | 'logger'>) {
  const logger = globalLogger.child({ service: 'CommsService' });

  async function subscribe(list: CommsList, input: SubscribeInput) {
    if (!commsProvider) {
      logger.debug('Comms provider not configured; cannot subscribe user.');
      return;
    }

    await commsProvider.subscribe(list, input);
    logger.debug('Subscription request processed.', { list });
  };

  return {
    subscribe,
  };
}

export default commsService;

export type CommsService = ReturnType<typeof commsService>;
