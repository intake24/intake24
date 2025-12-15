# Database

Database engine is [PostgreSQL](https://www.postgresql.org) and API Server is using mixture of two abstractions:

- [Sequelize](https://sequelize.org) ORM

- [Kysely](https://kysely.dev) query builder

Intake24 system has two main databases:

- `foods` - contains all foods related data (e.g. foods, food groups, nutrients, etc.)
- `system` - contains all system related data (e.g. users, permissions, roles, feedback schemes, surveys, etc.)

## Snapshots

Intake24 provides database snapshots for databases:

- `foods` - full database snapshot (structure + data)
- `system` - database structure-only snapshot (no data)

Database snapshots can be obtained in several ways:

1. Run [CLI command](/cli/init-assets.md) to download snapshots from public storage.
2. With Docker used, `init` script will create databases / download and import snapshots.
3. Download snapshots manually from public links below.

### Public download links

- [Foods database](https://storage.googleapis.com/intake24/snapshots/foods_snapshot.pgcustom)
- [System database](https://storage.googleapis.com/intake24/snapshots/system_snapshot.sql)

Once both databases are imported, system database needs to be initialized with default data and superuser account created using CLI [init:db:system](/cli/init-db-system) command.

## Images

Intake24 provides food images archive.

Food images can be obtained in several ways:

1. Run [CLI command](/cli/init-assets.md) to download and extract images from public storage.
2. Download images archive manually from public link below.

### Public download links

- [Foods images public download link](https://storage.googleapis.com/intake24/images/intake24-images-MRC-LIVE-19112025.zip)

Extract the downloaded archive to the desired location (e.g. `apps/api/storage/images`). See more details on configuring image assets directory in [Configuration -> filesystem](/config/api/filesystem#images-dir).

:::warning
Images are very large (more than 18GB). Make sure you have enough disk space before downloading and extracting the archive.
:::

Refer to how to configure image assets directory.

## Migrations

Database migrations are being handled by [sequelize-cli](https://sequelize.org/docs/v6/other-topics/migrations).

### Migrate system database

Migration commands can be being executed either from `project root` or `packages/db` directory.

```sh
pnpm db:system:migrate

# shorthand for

pnpm sequelize db:migrate --options-path sequelize/system/options.js
```

### Migrate foods database

```sh
pnpm db:foods:migrate

# shorthand for

pnpm sequelize db:migrate --options-path sequelize/foods/options.js
```

## Import database snapshots

If you have a DB snapshots of Intake24, you can use CLI to import to the database server.

### PostgreSQL

PostgreSQL is running on the standard port `5432`.

The Intake24 databases are:

- System database: `intake24_system`, user `intake24`, no password.
- Foods database: `intake24_foods`, user `intake24`, no password.

### Importing foods and system databases

::: warning
Note: The scripts in this sessions aimed for setup PostgreSQL for Intake24 local development purpose only.
:::

1. Export PostgresQL username password and host name to local development environment.

```
export PGUSER='postgres'
export PGPASSWORD='postgres'
export PGHOST="localhost"
```

2. Create a user in Postgres called `intake24` with password `intake24`

```
psql -d postgres -c "CREATE ROLE intake24 WITH PASSWORD 'intake24' LOGIN;"
```

3. Create DB `intake24_foods` and add extensions

```
createdb --owner=intake24 intake24_foods
psql -d intake24_foods -c "create extension btree_gist"
psql -d intake24_foods -c "create extension \"uuid-ossp\""
```

4. Import snapshot file to DB `intake24_foods`

```
pg_restore -n public --no-owner --no-acl --role=intake24 --dbname intake24_foods ./intake24-foods-snapshot.pgcustom
```

Change the path of the snapshot file as needed, e.g. `intake24-foods-snapshot.pgcustom`

5. Create DB `intake24_system`

```
createdb --owner=intake24 intake24_system
```

6. Import snapshot file to DB `intake24_system`.

```
pg_restore -n public --no-owner --no-acl --role=intake24 --dbname intake24_system ./intake24-system-snapshot.pgcustom
```

Change the path of the snapshot file as needed, e.g. `intake24-system-snapshot.pgcustom`

7. Login to `intake24_system` using PSQL, and insert admin user (e.g. `admin@example.com`, or any email you prefer) to `users` table.

Write down return user id. It will be useful in the next step.

```
psql -d intake24_system

insert into users (id, "name", email, phone, simple_name, email_notifications, sms_notifications, multi_factor_authentication, created_at, updated_at, verified_at, disabled_at) values (default, 'Admin', 'admin@example.com', '', 'Admin', true, true, false, now(), now(), now(), null) returning id;
```

```
id
-------
11969
(1 row)
```

8. Go to the `apps/cli` directory in the source tree and run

```
pnpm run cli hash-password [your password]
```

Replace `[your password]` to the password you want.

9. Replace `[hash]` and `[salt]` with the password hash and salt generated, and insert to user by id.

```
insert into user_passwords (user_id, password_hash, password_salt, password_hasher) values (11969, '[hash]', '[salt]', 'bcrypt');
```

10. Give this user id superuser permissions:

```
insert into role_user (role_id, user_id, created_at, updated_at) values (1, 11969, now(), now());
```

By that you created admin test account `admin@example.com` in development database.

## Upgrade guide

Intake24 V3 to V4 upgrade guide (WIP)

### Migrate databases

Use most up-to-date V3 `foods` and `system` databases to run the migrations.

1. Migrate system database

```sh
pnpm db:system:migrate
```

2. Migrate foods database

```sh
pnpm db:foods:migrate
```

:::tip
Depending on size of the databases, migration process can take from seconds to minutes. Both databases are being upgraded to use int8 instead of int4, which takes most of the time.

If you run into query timeout issues, you will have to increase the limits in sequelize config file (`packages/db/sequelize/{foods|system}/config.js`).

:::

:::warning
Run the migration in specified order per above.

Some of the system database migrations are using foods database data (e.g. feedback data conversion into feedback-schemes) and eventually V3 old tables are dropped. Running the migrations in wrong order will fail.
:::

### Seed databases with relevant data

Some of V3 data are being moved to database. To get this data into the database, run relevant seeders.

#### Standard units

Standard units are being moved from V3 translation files to database. To seed the database with V3 source code standard units, run the following command:

```sh
cd packages/db

pnpm sequelize db:seed --seed v3-standard-units.js --options-path sequelize/foods/options.js
```

#### Recipe foods

Recipe foods are being moved from V3 translation files to database. To seed the database with V3-like data, run the following command:

```sh
cd packages/db

pnpm sequelize db:seed --seed v3-recipe-foods.js --options-path sequelize/foods/options.js
```

## System database clean-up

### Truncate all tables except `sequelize_meta`

```sql
TRUNCATE TABLE `table` RESTART IDENTITY CASCADE;
```

### Re-initialize data

```sh
pnpm cli init:db:system
```
