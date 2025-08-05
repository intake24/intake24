// Minimal set of dependencies required to get a database connection, no need to pull in
// stuff like redis, mail etc. as in integration suite

import appConfig from '@intake24/api/config/app';
import { logger } from '@intake24/common-backend';
import type { DatabasesInterface } from '@intake24/db';
import { Database, databaseConfig } from '@intake24/db';

let databases: DatabasesInterface;

export async function initDatabases(): Promise<DatabasesInterface> {
  console.info(
    `Using database ${databaseConfig.test.foods.database} on ${databaseConfig.test.foods.host}`,
  );

  databases = new Database({
    environment: appConfig.env,
    databaseConfig,
    logger,
  });

  databases.init();
  await databases.sync(true);

  return databases;
}

export async function releaseDatabases(): Promise<void> {
  // Clean up the tables created by Sequelize to leave the database in the original blank state
  await databases.system.drop({ cascade: true });
  await databases.foods.drop({ cascade: true });

  // Close database connections to let test runner detect termination correctly
  await databases.close();
}

function logSql(sql: string, queryObject: any) {
  console.debug(`${sql} with parameters ${queryObject.bind}`);
}

// These functions can be used to temporarily enable/disable SQL query logging for easier debugging
// when testing. Enabling logging globally results in too much noise because all the initial table
// creation queries etc. get logged.

export function enableSqlLogging() {
  databases.foods.options.logging = logSql;
}

export function disableSqlLogging() {
  databases.foods.options.logging = false;
}
