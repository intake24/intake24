import type { Express } from 'express';

import type { Ops } from '@intake24/api/app';

import ioc from '@intake24/api/ioc';

import expressLoader from './express';
import routesLoader from './routes';
import securityLoader from './security';
import servicesLoader from './services';

export default async (app: Express, ops: Ops): Promise<void> => {
  const logger = ops.logger.child({ service: 'Application' });

  // This has to be injected first to get correct request timing stats
  ioc.cradle.appMetricsService.useHttpMetricsMiddleware(app);

  securityLoader(app, ops);
  logger.info('Security settings loaded.');

  expressLoader(app, ops);
  logger.info('Express defaults loaded.');

  await servicesLoader(ops);
  logger.info('Services loaded.');

  routesLoader(app, ops);
  logger.info('Routes loaded.');
};
