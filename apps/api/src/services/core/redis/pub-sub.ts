import type { IoC } from '@intake24/api/ioc';
import HasRedisClient from './redis-store';

export class Subscriber extends HasRedisClient {
  private readonly channels;
  private readonly foodIndex;

  constructor({
    foodIndex,
    logger,
    subscriberConfig: { channels, redis },
  }: Pick<IoC, 'foodIndex' | 'logger' | 'subscriberConfig'>) {
    super({ config: redis, logger: logger.child({ service: 'Redis-Publisher' }) });
    this.channels = channels;
    this.foodIndex = foodIndex;
  }

  async subscribe() {
    this.channels.forEach(async (subscriptionChannel) => {
      this.redis
        .on('message', (channel, message) => {
          console.log(`Received message from channel ${channel}: ${message}`);
          if (channel === 'locales-index') {
            this.onLocaleIndex(message).catch((error) => {
              this.logger.error('Error processing locale index message:', error);
            });
          }
        })
        .subscribe(subscriptionChannel, (error, count) => {
          if (error) {
          // Handle subscription error
            this.logger.error('Failed to subscribe: ', error);
            return;
          }
          this.logger.info(
            `Subscribed to ${count} channel(s). Waiting for updates on the '${subscriptionChannel}' channel.`,
          );
        });
    });
  }

  private async onLocaleIndex(message: string) {
    const locales = JSON.parse(message);
    this.logger.info('Rebuilding food index for locales:', locales);
    await this.foodIndex.rebuild(locales.includes('all') ? undefined : locales);
  }
}
