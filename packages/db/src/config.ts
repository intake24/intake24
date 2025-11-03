import type { Dialect, Options } from 'sequelize';

import type { Dictionary, Environment } from '@intake24/common/types';

export type DatabaseType = 'foods' | 'system';

export interface ExtraOptions {
  url?: string;
  debugQueryLimit: number;
}

export type DBConnectionInfo = Record<DatabaseType, Options & ExtraOptions>;
export type DatabaseConfig = Record<Environment, DBConnectionInfo>;

export type OpsDialect = Extract<Dialect, 'mariadb' | 'mysql' | 'mssql' | 'postgres'>;

const dialectOptions: Record<OpsDialect, Dictionary> = {
  mariadb: {
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
  mysql: {
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
  mssql: {},
  postgres: {
    ssl: process.env.DB_CONNECTION_SSL === 'true',
  },
};

export const databaseConfig: DatabaseConfig = {
  development: {
    foods: {
      url: process.env.DB_DEV_FOODS_URL,
      host: process.env.DB_DEV_FOODS_HOST,
      port: process.env.DB_DEV_FOODS_PORT ? Number.parseInt(process.env.DB_DEV_FOODS_PORT, 10) : undefined,
      database: process.env.DB_DEV_FOODS_DATABASE,
      username: process.env.DB_DEV_FOODS_USERNAME,
      password: process.env.DB_DEV_FOODS_PASSWORD,
      dialect: (process.env.DB_DEV_FOODS_DRIVER || 'postgres') as Dialect,
      dialectOptions: dialectOptions[process.env.DB_DEV_FOODS_DRIVER as OpsDialect],
      pool: {
        max: process.env.DB_DEV_FOODS_POOL_MAX ? Number.parseInt(process.env.DB_DEV_FOODS_POOL_MAX, 10) : 10,
      },
      debugQueryLimit: Number.parseInt(process.env.DB_DEV_FOODS_DEBUG_QUERY_LIMIT || '0', 10),
    },
    system: {
      url: process.env.DB_DEV_SYSTEM_URL,
      host: process.env.DB_DEV_SYSTEM_HOST,
      port: process.env.DB_DEV_SYSTEM_PORT
        ? Number.parseInt(process.env.DB_DEV_SYSTEM_PORT, 10)
        : undefined,
      database: process.env.DB_DEV_SYSTEM_DATABASE,
      username: process.env.DB_DEV_SYSTEM_USERNAME,
      password: process.env.DB_DEV_SYSTEM_PASSWORD ?? '',
      dialect: (process.env.DB_DEV_SYSTEM_DRIVER || 'postgres') as Dialect,
      dialectOptions: dialectOptions[process.env.DB_DEV_SYSTEM_DRIVER as OpsDialect],
      pool: {
        max: process.env.DB_DEV_SYSTEM_POOL_MAX ? Number.parseInt(process.env.DB_DEV_SYSTEM_POOL_MAX, 10) : 10,
      },
      debugQueryLimit: Number.parseInt(process.env.DB_DEV_SYSTEM_DEBUG_QUERY_LIMIT || '0', 10),
    },
  },
  test: {
    foods: {
      url: process.env.DB_TEST_FOODS_URL,
      host: process.env.DB_TEST_FOODS_HOST,
      port: process.env.DB_TEST_FOODS_PORT
        ? Number.parseInt(process.env.DB_TEST_FOODS_PORT, 10)
        : undefined,
      database: process.env.DB_TEST_FOODS_DATABASE,
      username: process.env.DB_TEST_FOODS_USERNAME,
      password: process.env.DB_TEST_FOODS_PASSWORD,
      dialect: (process.env.DB_TEST_FOODS_DRIVER || 'postgres') as Dialect,
      dialectOptions: dialectOptions[process.env.DB_TEST_FOODS_DRIVER as OpsDialect],
      pool: {
        max: process.env.DB_TEST_FOODS_POOL_MAX ? Number.parseInt(process.env.DB_TEST_FOODS_POOL_MAX, 10) : 10,
      },
      debugQueryLimit: Number.parseInt(process.env.DB_TEST_FOODS_DEBUG_QUERY_LIMIT || '0', 10),
    },
    system: {
      url: process.env.DB_TEST_SYSTEM_URL,
      host: process.env.DB_TEST_SYSTEM_HOST,
      port: process.env.DB_TEST_SYSTEM_PORT
        ? Number.parseInt(process.env.DB_TEST_SYSTEM_PORT, 10)
        : undefined,
      database: process.env.DB_TEST_SYSTEM_DATABASE,
      username: process.env.DB_TEST_SYSTEM_USERNAME,
      password: process.env.DB_TEST_SYSTEM_PASSWORD,
      dialect: (process.env.DB_TEST_SYSTEM_DRIVER || 'postgres') as Dialect,
      dialectOptions: dialectOptions[process.env.DB_TEST_SYSTEM_DRIVER as OpsDialect],
      pool: {
        max: process.env.DB_TEST_SYSTEM_POOL_MAX ? Number.parseInt(process.env.DB_TEST_SYSTEM_POOL_MAX, 10) : 10,
      },
      debugQueryLimit: Number.parseInt(process.env.DB_TEST_SYSTEM_DEBUG_QUERY_LIMIT || '0', 10),
    },
  },
  production: {
    foods: {
      url: process.env.DB_FOODS_URL,
      host: process.env.DB_FOODS_HOST,
      port: process.env.DB_FOODS_PORT ? Number.parseInt(process.env.DB_FOODS_PORT, 10) : undefined,
      database: process.env.DB_FOODS_DATABASE,
      username: process.env.DB_FOODS_USERNAME,
      password: process.env.DB_FOODS_PASSWORD,
      dialect: (process.env.DB_FOODS_DRIVER || 'postgres') as Dialect,
      dialectOptions: dialectOptions[process.env.DB_FOODS_DRIVER as OpsDialect],
      pool: {
        max: process.env.DB_FOODS_POOL_MAX ? Number.parseInt(process.env.DB_FOODS_POOL_MAX, 10) : 10,
      },
      debugQueryLimit: Number.parseInt(process.env.DB_FOODS_DEBUG_QUERY_LIMIT || '0', 10),
    },
    system: {
      url: process.env.DB_SYSTEM_URL,
      host: process.env.DB_SYSTEM_HOST,
      port: process.env.DB_SYSTEM_PORT ? Number.parseInt(process.env.DB_SYSTEM_PORT, 10) : undefined,
      database: process.env.DB_SYSTEM_DATABASE,
      username: process.env.DB_SYSTEM_USERNAME,
      password: process.env.DB_SYSTEM_PASSWORD,
      dialect: (process.env.DB_SYSTEM_DRIVER || 'postgres') as Dialect,
      dialectOptions: dialectOptions[process.env.DB_SYSTEM_DRIVER as OpsDialect],
      pool: {
        max: process.env.DB_SYSTEM_POOL_MAX ? Number.parseInt(process.env.DB_SYSTEM_POOL_MAX, 10) : 10,
      },
      debugQueryLimit: Number.parseInt(process.env.DB_SYSTEM_DEBUG_QUERY_LIMIT || '0', 10),
    },
  },
};
