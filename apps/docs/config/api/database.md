# Database

Path: `packages/db/src/config.ts`

Connection info is defined per-environment and per-database.

System consists of two databases:

- `Foods` - food-related information, mostly static content
- `System` - users / surveys related information, system configuration etc

**Environments**:

- `development` - local development environment
- `test` - local tests and CI environment
- `production` - production environment

**Connection types**

1. Connection URL - use `url` property
2. Connection credentials - use `host`, `port`, `database`, `username` and `password` properties

## URL

Examples

`DB_DEV_SYSTEM_URL=postgres://user:password@localhost:5432/intake24_system_dev`

`DB_DEV_FOODS_URL=postgres://user:password@localhost:5432/intake24_foods_dev`

- object-path: `[environment][database].url`
- dotenv vars:
  - `development`: `DB_DEV_FOODS_URL` and `DB_DEV_SYSTEM_URL`
  - `test`: `DB_TEST_FOODS_URL` and `DB_TEST_SYSTEM_URL`
  - `production`: `DB_FOODS_URL` and `DB_SYSTEM_URL`
- type: `string | undefined`
- default: `undefined`

## Host

- object-path: `[environment][database].host`
- dotenv vars:
  - `development`: `DB_DEV_FOODS_HOST` and `DB_DEV_SYSTEM_HOST`
  - `test`: `DB_TEST_FOODS_HOST` and `DB_TEST_SYSTEM_HOST`
  - `production`: `DB_FOODS_HOST` and `DB_SYSTEM_HOST`
- type: `string | undefined`
- default: `undefined`

## Port

- object-path: `[environment][database].port`
- dotenv vars:
  - `development`: `DB_DEV_FOODS_PORT` and `DB_DEV_SYSTEM_PORT`
  - `test`: `DB_TEST_FOODS_PORT` and `DB_TEST_SYSTEM_PORT`
  - `production`: `DB_FOODS_PORT` and `DB_SYSTEM_PORT`
- type: `number | undefined`
- default: `undefined`

## Database

- object-path: `[environment][database].database`
- dotenv vars:
  - `development`: `DB_DEV_FOODS_DATABASE` and `DB_DEV_SYSTEM_DATABASE`
  - `test`: `DB_TEST_FOODS_DATABASE` and `DB_TEST_SYSTEM_DATABASE`
  - `production`: `DB_FOODS_DATABASE` and `DB_SYSTEM_DATABASE`
- type: `string | undefined`
- default: `undefined`

## Username

- object-path: `[environment][database].username`
- dotenv vars:
  - `development`: `DB_DEV_FOODS_USERNAME` and `DB_DEV_SYSTEM_USERNAME`
  - `test`: `DB_TEST_FOODS_USERNAME` and `DB_TEST_SYSTEM_USERNAME`
  - `production`: `DB_FOODS_USERNAME` and `DB_SYSTEM_USERNAME`
- type: `string | undefined`
- default: `undefined`

## Password

- object-path: `[environment][database].password`
- dotenv vars:
  - `development`: `DB_DEV_FOODS_PASSWORD` and `DB_DEV_SYSTEM_PASSWORD`
  - `test`: `DB_TEST_FOODS_PASSWORD` and `DB_TEST_SYSTEM_PASSWORD`
  - `production`: `DB_FOODS_PASSWORD` and `DB_SYSTEM_PASSWORD`
- type: `string | undefined`
- default: `undefined`

## Dialect

- object-path: `[environment][database].dialect`
- dotenv vars:
  - `development`: `DB_DEV_FOODS_DRIVER` and `DB_DEV_SYSTEM_DRIVER`
  - `test`: `DB_TEST_FOODS_DRIVER` and `DB_TEST_SYSTEM_DRIVER`
  - `production`: `DB_FOODS_DRIVER` and `DB_SYSTEM_DRIVER`
- type: `'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql'`
- default: `'postgres'`

## Pool max connections

- object-path: `[environment][database].pool.max`
- dotenv vars:
  - `development`: `DB_DEV_FOODS_POOL_MAX` and `DB_DEV_SYSTEM_POOL_MAX`
  - `test`: `DB_TEST_FOODS_POOL_MAX` and `DB_TEST_SYSTEM_POOL_MAX`
  - `production`: `DB_FOODS_POOL_MAX` and `DB_SYSTEM_POOL_MAX`
- type: `number`
- default: `10`

## Security

SSL connection for database (only Postgresql dialect supported at the moment)

- object-path: `[environment].security`
- dotenv vars:
  - `development`: `DB_CONNECTION_SSL`
  - `test`: `DB_CONNECTION_SSL`
  - `production`: `DB_CONNECTION_SSL`
- type: `'true' | 'false'`
- default: `'false'`
