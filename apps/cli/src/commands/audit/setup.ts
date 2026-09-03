import type { DatabaseType } from '@intake24/db';

import { intro, log, outro } from '@clack/prompts';
import color from 'picocolors';

import config from '@intake24/cli/config';
import { logger } from '@intake24/common-backend/services/logger';
import { KyselyDatabases } from '@intake24/db';

import { auditFunction, createAuditTable, createTriggers, dropTriggers, jsonbSubtractFunction } from './sql';

export default async function (db: DatabaseType, _ops: { force: boolean }) {
  intro(color.bgCyanBright(color.black('Audit: Setting up audit table and trigger function')));

  const kysely = new KyselyDatabases({
    environment: process.env.NODE_ENV as any || 'development',
    logger,
    databaseConfig: config.database,
  });

  try {
    await kysely.init();

    await kysely[db].transaction().execute(async (trx) => {
      await dropTriggers.execute(trx);
      await createAuditTable.execute(trx);
      await jsonbSubtractFunction.execute(trx);
      await auditFunction.execute(trx);
      await createTriggers.execute(trx);
    });

    outro('Audit table and trigger function set up successfully.');
  }
  catch (error) {
    console.log(error);
    log.error(`Error setting up audit table and trigger function: ${error}`);
  }
  finally {
    await kysely.close();
  }
};
