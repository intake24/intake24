import appConfig from '@intake24/api/config/app';
import { logger } from '@intake24/common-backend';
import { databaseConfig, KyselyDatabases } from '@intake24/db';

export function getKyselyInterface(): KyselyDatabases {
  return new KyselyDatabases({
    environment: appConfig.env,
    databaseConfig,
    logger,
  });
}
