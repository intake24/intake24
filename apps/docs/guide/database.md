<script setup lang="ts">
  import { onMounted, ref } from 'vue';

  const links: Record<'system' | 'foods' | 'images', string> = ref({});

  onMounted(async () => {
    links.value = await (await fetch('https://storage.googleapis.com/intake24/assets/assets.json')).json();
  });

</script>

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

<ul v-if="Object.keys(links).length">
  <li>
    <a :href="links.foods" target="_blank" rel="noopener">Foods database</a>
  </li>
  <li>
    <a :href="links.system" target="_blank" rel="noopener">System database</a>
  </li>
</ul>

## Import database snapshots

Once you have DB snapshots of Intake24, you can use CLI to import to the database server.

### PostgreSQL

PostgreSQL is running on the standard port `5432`.

The Intake24 databases are:

- System database: `intake24_system`, user `intake24`, password `intake24`.
- Foods database: `intake24_foods`, user `intake24`, password `intake24`.

:::tip

The CLI command `pnpm cli init:env` assumes different database names for development, test and production environments.

Development environment:

- System database: `intake24_system_dev`, user `intake24`, password `intake24`.
- Foods database: `intake24_foods_dev`, user `intake24`, password `intake24`.

Test environment:

- System database: `intake24_system_test`, user `intake24`, password `intake24`.
- Foods database: `intake24_foods_test`, user `intake24`, password `intake24`.

Please adjust the database names in below commands accordingly if you are using different environment.
:::

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
pg_restore -n public --no-owner --no-acl --role=intake24 --dbname intake24_foods ./foods_snapshot.pgcustom
```

Change the path of the snapshot file as needed, e.g. `foods_snapshot.pgcustom`

1. Create DB `intake24_system`

```
createdb --owner=intake24 intake24_system
```

6. Import snapshot file to DB `intake24_system`.

Locate the `system` database snapshot file and run:

```
pg_restore -n public --no-owner --no-acl --role=intake24 --dbname intake24_system ./system_snapshot.pgcustom
```

Now you have both `foods` and `system` databases imported from snapshots.

## Migrations

Since snapshots might be outdated, run the migrations to bring both databases to the latest version.

Database migrations are being handled by [sequelize-cli](https://sequelize.org/docs/v6/other-topics/migrations).

On the project root, run this single command to migrate both `foods` and `system` databases:

```sh
pnpm db:migrate
```

Or, you can run below commands separately for each database.

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

## Initialize system database

Once both databases are imported and migrated to the latest version, the system database needs to be initialized with default data and superuser account (admin user of Intake24) created using CLI:

```sh
pnpm cli init:db:system
```

For more details, please refer to [Initialize system database](/cli/init-db-system.md) documentation.

Now you have updated `foods` and `system` databases, and created with admin account as specified.

## Images

Intake24 provides food images archive, which stored as file system assets and being access by Intake24 applications.

Food images can be obtained in several ways:

1. Run [CLI command](/cli/init-assets.md) to download and extract images from public storage.
2. Download images archive manually from public link below.

### Public download links

<ul v-if="Object.keys(links).length">
  <li>
    <a :href="links.images" target="_blank" rel="noopener">Foods images public download link</a>
  </li>
</ul>

Extract the downloaded archive to the desired location (e.g. `apps/api/storage/images`). See more details on configuring image assets directory in [Configuration -> filesystem](/config/api/filesystem#images-dir).

:::warning
Images are very large (more than 18GB). Make sure you have enough disk space before downloading and extracting the archive.
:::

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

Please refer [Initialize system database](/cli/init-db-system.md) the CLI command to re-initialize system database with default data and create an admin user.
