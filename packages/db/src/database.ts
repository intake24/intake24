import type { DatabaseConfig, DatabaseType } from './config';
import type { Logger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';

import { Sequelize } from 'sequelize-typescript';

import { foods, system } from './models';

export const models = { foods, system };

export type BaseDatabasesInterface = Record<DatabaseType, Sequelize>;

export interface DatabasesInterface extends BaseDatabasesInterface {
  init: () => void;
  close: () => Promise<void>;
  sync: (force: boolean) => Promise<void>;
}

export type DatabaseOptions = {
  environment: Environment;
  databaseConfig: DatabaseConfig;
  logger: Logger;
};

export function databaseLogQuery(sql: string, logger: Logger, limit: number) {
  if (limit > 0 && sql.length > limit)
    logger.debug(`${sql.substring(0, limit)}...`);
  else
    logger.debug(sql);
}

export class Database implements DatabasesInterface {
  private readonly config;

  private readonly env;

  private readonly logger;

  public foods!: Sequelize;

  public system!: Sequelize;

  constructor({ environment, databaseConfig, logger }: DatabaseOptions) {
    this.env = environment;
    this.config = databaseConfig;
    this.logger = logger.child({ service: 'Database' });
  }

  init() {
    const isDebug = this.logger.level === 'debug';

    for (const database of Object.keys(this.config[this.env]) as DatabaseType[]) {
      const { debugQueryLimit, url, ...rest } = this.config[this.env][database];

      const config = {
        ...rest,
        models: Object.values(models[database]),
        benchmark: isDebug,
        logging: (sql: string, timing?: number) => {
          databaseLogQuery(`Query${isDebug ? ` [${timing} ms]` : ''}: ${sql}`, this.logger, debugQueryLimit);
        },
      };

      this[database] = url ? new Sequelize(url, config) : new Sequelize(config);
    }
  }

  async sync(force = false) {
    await Promise.all([this.foods.sync({ force }), this.system.sync({ force })]);
  }

  async close() {
    await Promise.all([this.foods.close(), this.system.close()]);
  }
}
