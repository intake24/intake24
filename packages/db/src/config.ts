import { z } from 'zod';

import { validateConfig } from '@intake24/common-backend';
import { environmentOptions } from '@intake24/common/types';

export const databaseType = ['foods', 'system'] as const;
export type DatabaseType = typeof databaseType[number];

export const dbConnectionInfo = z.object({
  url: z.string().optional(),
  host: z.string().optional(),
  port: z.coerce.number().int().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  dialect: z.literal('postgres').default('postgres'),
  dialectOptions: z.object({
    ssl: z.boolean().or(z.stringbool()).default(false),
  }),
  pool: z.object({
    max: z.number().int().default(10),
  }),
  debugQueryLimit: z.coerce.number().int().default(0),
});

const databaseConfigSchema = z.record(z.enum(environmentOptions), z.record(z.enum(databaseType), dbConnectionInfo));
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export const rawDatabaseConfig = {
  development: {
    foods: {
      url: process.env.DB_DEV_FOODS_URL,
      host: process.env.DB_DEV_FOODS_HOST,
      port: process.env.DB_DEV_FOODS_PORT,
      database: process.env.DB_DEV_FOODS_DATABASE,
      username: process.env.DB_DEV_FOODS_USERNAME,
      password: process.env.DB_DEV_FOODS_PASSWORD,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_DEV_FOODS_SSL,
      },
      pool: {
        max: process.env.DB_DEV_FOODS_POOL_MAX,
      },
      debugQueryLimit: process.env.DB_DEV_FOODS_DEBUG_QUERY_LIMIT,
    },
    system: {
      url: process.env.DB_DEV_SYSTEM_URL,
      host: process.env.DB_DEV_SYSTEM_HOST,
      port: process.env.DB_DEV_SYSTEM_PORT,
      database: process.env.DB_DEV_SYSTEM_DATABASE,
      username: process.env.DB_DEV_SYSTEM_USERNAME,
      password: process.env.DB_DEV_SYSTEM_PASSWORD,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_DEV_SYSTEM_SSL,
      },
      pool: {
        max: process.env.DB_DEV_SYSTEM_POOL_MAX,
      },
      debugQueryLimit: process.env.DB_DEV_SYSTEM_DEBUG_QUERY_LIMIT,
    },
  },
  test: {
    foods: {
      url: process.env.DB_TEST_FOODS_URL,
      host: process.env.DB_TEST_FOODS_HOST,
      port: process.env.DB_TEST_FOODS_PORT,
      database: process.env.DB_TEST_FOODS_DATABASE,
      username: process.env.DB_TEST_FOODS_USERNAME,
      password: process.env.DB_TEST_FOODS_PASSWORD,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_TEST_FOODS_SSL,
      },
      pool: {
        max: process.env.DB_TEST_FOODS_POOL_MAX,
      },
      debugQueryLimit: process.env.DB_TEST_FOODS_DEBUG_QUERY_LIMIT,
    },
    system: {
      url: process.env.DB_TEST_SYSTEM_URL,
      host: process.env.DB_TEST_SYSTEM_HOST,
      port: process.env.DB_TEST_SYSTEM_PORT,
      database: process.env.DB_TEST_SYSTEM_DATABASE,
      username: process.env.DB_TEST_SYSTEM_USERNAME,
      password: process.env.DB_TEST_SYSTEM_PASSWORD,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_TEST_SYSTEM_SSL,
      },
      pool: {
        max: process.env.DB_TEST_SYSTEM_POOL_MAX,
      },
      debugQueryLimit: process.env.DB_TEST_SYSTEM_DEBUG_QUERY_LIMIT,
    },
  },
  production: {
    foods: {
      url: process.env.DB_FOODS_URL,
      host: process.env.DB_FOODS_HOST,
      port: process.env.DB_FOODS_PORT,
      database: process.env.DB_FOODS_DATABASE,
      username: process.env.DB_FOODS_USERNAME,
      password: process.env.DB_FOODS_PASSWORD,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_FOODS_SSL,
      },
      pool: {
        max: process.env.DB_FOODS_POOL_MAX,
      },
      debugQueryLimit: process.env.DB_FOODS_DEBUG_QUERY_LIMIT,
    },
    system: {
      url: process.env.DB_SYSTEM_URL,
      host: process.env.DB_SYSTEM_HOST,
      port: process.env.DB_SYSTEM_PORT,
      database: process.env.DB_SYSTEM_DATABASE,
      username: process.env.DB_SYSTEM_USERNAME,
      password: process.env.DB_SYSTEM_PASSWORD,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_SYSTEM_SSL,
      },
      pool: {
        max: process.env.DB_SYSTEM_POOL_MAX,
      },
      debugQueryLimit: process.env.DB_SYSTEM_DEBUG_QUERY_LIMIT,
    },
  },
};

export const databaseConfig = validateConfig('Database configuration', databaseConfigSchema, rawDatabaseConfig);
export default databaseConfig;
