import type { DatabaseType } from '@intake24/db';

import { intro, log, outro } from '@clack/prompts';
import color from 'picocolors';

import config from '@intake24/cli/config';
import { logger } from '@intake24/common-backend/services/logger';
import { KyselyDatabases } from '@intake24/db';

import { dropTriggers } from './sql';

export default async function (db: DatabaseType, _ops: { force: boolean }) {
  intro(color.bgCyanBright(color.black('Audit: Disabling table triggers')));

  const kysely = new KyselyDatabases({
    environment: process.env.NODE_ENV as any || 'development',
    logger,
    databaseConfig: config.database,
  });

  try {
    await kysely.init();

    await dropTriggers.execute(kysely[db]);

    outro('Audit triggers disabled.');
  }
  catch (error) {
    console.log(error);
    log.error(`Error disabling audit triggers: ${error}`);
  }
  finally {
    await kysely.close();
  }
};
