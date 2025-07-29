import type { RequestIoC } from './ioc';
import { asClass, asValue, createContainer } from 'awilix';
import config from '@intake24/api/config';
import { Database, KyselyDatabases, models } from '@intake24/db';
import controllers from './controllers';
import jobs from './jobs';
import services from './services';

export * from './ioc';

function configureContainer() {
  const container = createContainer<RequestIoC>({ strict: true });

  container.register({
    config: asValue(config),
    aclConfig: asValue(config.acl),
    appConfig: asValue(config.app),
    cacheConfig: asValue(config.cache),
    databaseConfig: asValue(config.database),
    fsConfig: asValue(config.filesystem),
    logConfig: asValue(config.log),
    mailConfig: asValue(config.mail),
    pdfConfig: asValue(config.pdf),
    queueConfig: asValue(config.queue),
    rateLimiterConfig: asValue(config.rateLimiter),
    securityConfig: asValue(config.security),
    servicesConfig: asValue(config.services),
    sessionConfig: asValue(config.session),
    publisherConfig: asValue(config.publisher),
    subscriberConfig: asValue(config.subscriber),
    environment: asValue(config.app.env),
    imagesBaseUrl: asValue(config.app.urls.images),
    imageProcessorConfig: asValue(config.imageProcessor),
    db: asClass(Database).singleton(),
    kyselyDb: asClass(KyselyDatabases).singleton(),
    models: asValue(models),
  });

  controllers(container);
  services(container);
  jobs(container);

  return container;
}

export default configureContainer();
