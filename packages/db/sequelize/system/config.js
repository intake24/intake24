import { resolve } from 'node:path';

import dotenv from 'dotenv';

dotenv.config({ path: resolve('../../apps/api/.env') });

const dialectOptions = {
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

export default {
  development: {
    url: process.env.DB_DEV_SYSTEM_URL,
    host: process.env.DB_DEV_SYSTEM_HOST,
    port: process.env.DB_DEV_SYSTEM_PORT,
    database: process.env.DB_DEV_SYSTEM_DATABASE,
    username: process.env.DB_DEV_SYSTEM_USERNAME,
    password: process.env.DB_DEV_SYSTEM_PASSWORD,
    dialect: process.env.DB_DEV_SYSTEM_DRIVER,
    dialectOptions: dialectOptions[process.env.DB_DEV_SYSTEM_DRIVER],
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
  },
  test: {
    url: process.env.DB_TEST_SYSTEM_URL,
    host: process.env.DB_TEST_SYSTEM_HOST,
    port: process.env.DB_TEST_SYSTEM_PORT,
    database: process.env.DB_TEST_SYSTEM_DATABASE,
    username: process.env.DB_TEST_SYSTEM_USERNAME,
    password: process.env.DB_TEST_SYSTEM_PASSWORD,
    dialect: process.env.DB_TEST_SYSTEM_DRIVER,
    dialectOptions: dialectOptions[process.env.DB_TEST_SYSTEM_DRIVER],
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
  },
  production: {
    url: process.env.DB_SYSTEM_URL,
    host: process.env.DB_SYSTEM_HOST,
    port: process.env.DB_SYSTEM_PORT,
    database: process.env.DB_SYSTEM_DATABASE,
    username: process.env.DB_SYSTEM_USERNAME,
    password: process.env.DB_SYSTEM_PASSWORD,
    dialect: process.env.DB_SYSTEM_DRIVER,
    dialectOptions: dialectOptions[process.env.DB_SYSTEM_DRIVER],
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
  },
};
