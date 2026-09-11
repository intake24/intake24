import type { DatabaseType } from '@intake24/common/types';

import { intro, log, outro } from '@clack/prompts';
import color from 'picocolors';

import config from '@intake24/cli/config';
import { logger } from '@intake24/common-backend/services/logger';
import { KyselyDatabases } from '@intake24/db';

import {
  auditFunction,
  checkIfUUIDv7Exists,
  createAuditTable,
  createTriggers,
  createUUIDv7Function,
  dropAuditTable,
  dropTriggers,
  jsonbSubtractFunction,
} from './sql';

export default async function (db: DatabaseType, { force }: { force: boolean }) {
  intro(color.bgCyanBright(color.black('Audit: Setting up audit table and trigger function')));

  const kysely = new KyselyDatabases({
    environment: process.env.NODE_ENV as any || 'development',
    logger,
    databaseConfig: config.database,
  });

  try {
    await kysely.init();

    await kysely[db].transaction().execute(async (trx) => {
      await dropTriggers().execute(trx);

      if (force)
        await dropAuditTable.execute(trx);

      await createAuditTable.execute(trx);

      await jsonbSubtractFunction.execute(trx);
      await auditFunction.execute(trx);

      // Check if the UUIDv7 function exists (PG18+)
      const { rows: [uuidv7Exists] } = await checkIfUUIDv7Exists.execute(kysely[db]);
      if (!uuidv7Exists.exists) {
        await createUUIDv7Function.execute(trx);
      }

      await createTriggers(db).execute(trx);
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
