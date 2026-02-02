// Minimal set of dependencies required to get a database connection, no need to pull in
// stuff like redis, mail etc. as in integration suite

import type { DatabasesInterface } from '@intake24/db';

import appConfig from '@intake24/api/config/app';
import { logger } from '@intake24/common-backend';
import { Database, databaseConfig, KyselyDatabases } from '@intake24/db';

let sequelizeDbs: DatabasesInterface | undefined;
let kyselyDbs: KyselyDatabases | undefined;

let usingDatabases = false;

export async function useDatabases(): Promise<void> {
  if (usingDatabases) {
    throw new Error('Databases must be released before calling useDatabases() again');
  }

  usingDatabases = true;

  console.info(
    `Using database ${databaseConfig.test.foods.database} on ${databaseConfig.test.foods.host ?? 'localhost'}`,
  );

  sequelizeDbs = new Database({
    environment: appConfig.env,
    databaseConfig,
    logger,
  });

  kyselyDbs = new KyselyDatabases({
    environment: appConfig.env,
    databaseConfig,
    logger,
  });

  await sequelizeDbs.init();
  await kyselyDbs.init();

  await sequelizeDbs.sync(true);
}

export function getSequelizeDbs(): DatabasesInterface {
  if (!sequelizeDbs) {
    throw new Error('Sequelize databases not initialized');
  }

  return sequelizeDbs;
}

export function getKyselyDbs(): KyselyDatabases {
  if (!kyselyDbs) {
    throw new Error('Kysely databases not initialized');
  }

  return kyselyDbs;
}

export async function releaseDatabases(): Promise<void> {
  if (!sequelizeDbs || !kyselyDbs) {
    console.warn('Release database called without calling useDatabases(');
  }

  // Clean up the tables created by Sequelize to leave the database in the original blank state
  await sequelizeDbs!.system.drop({ cascade: true });
  await sequelizeDbs!.foods.drop({ cascade: true });

  // Close database connections to let test runner detect termination correctly
  await sequelizeDbs!.close();
  await kyselyDbs!.close();

  sequelizeDbs = undefined;
  kyselyDbs = undefined;

  usingDatabases = false;
}

function logSql(sql: string, queryObject: any) {
  console.debug(`${sql} with parameters ${queryObject.bind}`);
}

// These functions can be used to temporarily enable/disable SQL query logging for easier debugging
// when testing. Enabling logging globally results in too much noise because all the initial table
// creation queries etc. get logged.

export function enableSqlLogging() {
  sequelizeDbs!.foods.options.logging = logSql;
}

export function disableSqlLogging() {
  sequelizeDbs!.foods.options.logging = false;
}
