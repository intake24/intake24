import type { Ops } from '@intake24/api/app';
import ioc from '@intake24/api/ioc';

async function exitSignalHandler() {
  /*
   * Gracefully shut down workers
   * https://docs.bullmq.io/guide/going-to-production#gracefully-shut-down-workers
   */
  await ioc.cradle.scheduler.closeWorkers();

  ioc.cradle.appMetricsService.shutdown();

  await Promise.all([
    ioc.cradle.db.close(),
    ioc.cradle.kyselyDb.close(),
  ]);

  process.exit();
}

export default async (ops: Ops): Promise<void> => {
  // Databases
  await Promise.all([
    ioc.cradle.db.init(),
    ioc.cradle.kyselyDb.init(),
  ]);
  if (ops.config.app.env === 'test')
    await ioc.cradle.db.sync(true);

  // Cache
  ioc.cradle.cache.init();

  // Local filesystem
  await ioc.cradle.filesystem.init();

  // i18n translations
  await ioc.cradle.i18nStore.init();

  // Mailer
  ioc.cradle.mailer.init();

  // Pusher
  await ioc.cradle.pusher.init();

  // Rate limiter
  ioc.cradle.rateLimiter.init();

  // Food indexing and searching
  await ioc.cradle.foodIndex.init();

  // Redis indexing
  ioc.cradle.subscriber.init();
  await ioc.cradle.subscriber.subscribe();

  // Scheduler
  await ioc.cradle.scheduler.init();

  // Performance metrics
  ioc.cradle.appMetricsService.initDatabaseMetrics();

  // Exit signal handlers
  process.on('SIGINT', exitSignalHandler);
  process.on('SIGTERM', exitSignalHandler);
  process.on('SIGQUIT', exitSignalHandler);
};
