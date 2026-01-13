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
    url: process.env.DB_DEV_FOODS_URL,
    host: process.env.DB_DEV_FOODS_HOST,
    port: process.env.DB_DEV_FOODS_PORT,
    database: process.env.DB_DEV_FOODS_DATABASE,
    username: process.env.DB_DEV_FOODS_USERNAME,
    password: process.env.DB_DEV_FOODS_PASSWORD,
    dialect: process.env.DB_DEV_FOODS_DRIVER,
    dialectOptions: dialectOptions[process.env.DB_DEV_FOODS_DRIVER],
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
  },
  test: {
    url: process.env.DB_TEST_FOODS_URL,
    host: process.env.DB_TEST_FOODS_HOST,
    port: process.env.DB_TEST_FOODS_PORT,
    database: process.env.DB_TEST_FOODS_DATABASE,
    username: process.env.DB_TEST_FOODS_USERNAME,
    password: process.env.DB_TEST_FOODS_PASSWORD,
    dialect: process.env.DB_TEST_FOODS_DRIVER,
    dialectOptions: dialectOptions[process.env.DB_DEV_FOODS_DRIVER],
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
  },
  production: {
    url: process.env.DB_FOODS_URL,
    host: process.env.DB_FOODS_HOST,
    port: process.env.DB_FOODS_PORT,
    database: process.env.DB_FOODS_DATABASE,
    username: process.env.DB_FOODS_USERNAME,
    password: process.env.DB_FOODS_PASSWORD,
    dialect: process.env.DB_FOODS_DRIVER,
    dialectOptions: dialectOptions[process.env.DB_DEV_FOODS_DRIVER],
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
  },
};
