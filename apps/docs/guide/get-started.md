# Getting started

## Dev instance

Steps to getting a local instance running

- Setup the database
  - Method 1 (preferred): Execute Docker compose file `docker-compose.yml` to prepare PostgresQL and Redis instances, and map out port 5432 and 6379 respectively by default.
  - Method 2: Run Dev VM (download from S3 bucket - contact the Intake24 team), which maps out the database on 192.168.56.10:5432 (PostgreSQL). Start this VM.
- Obtain up-to-date database snapshots from the intake24 team and import them into a database by scripts or DB tools (e.g. DBeaver). Check the guidance on [importing database snapshots with DBeaver](https://dbeaver.com/docs/wiki/Backup-Restore/).
- Local servers need to be run for `api`, `admin` and `survey` from each respective folder:
- To start `api` / `admin` / `survey`: `pnpm dev` for live reloads

### Steps to run locally

#### Prerequisites

- Node.js v22.12.0 or newer
- pnpm v9.x or newer
- Docker v29 or newer (for running PostgreSQL 17 and Redis 8 instances)
- 4vGB+ free disk space (Or 50GB+ free disk space including downloading and extracting food images and database snapshots)

#### 1. Git clone Intake24 project

```sh
git clone https://github.com/intake24/intake24.git
```

#### 2. Install node packages for the whole projects

On project root folder, run

```sh
pnpm install
```

#### 3. Spin up Redis and PostgreSQL instance using docker compose

On project root folder, run

```sh
docker compose up -d
```

#### 4. Initialise environment files

On project root folder, run below command to build the CLI application under folder using development configuration

```sh
pnpm cli init:env
```

This will create `.env` files under `apps/api`, `apps/cli`, `apps/admin` and `apps/survey` folders, and populate the system database with default data. You can also use `-f` flag to force overwrite existing `.env` files if any.

#### 5. Populate system database

on project root folder, run below command

```sh
pnpm cli init:db:system
```

This will populate the system database with default data only. Follow the prompts to set up the admin user account.

Run database migration scripts to `foods` and `system` databases to make sure they are up to date by running below command under project root folder:

```sh
pnpm db:system:migrate
pnpm db:foods:migrate
```

For more information, refer to [Database migrations](/guide/database#database-migrations).

#### 6. Start API server

On `apps/api` folder, run

```sh
pnpm dev
```

The API server should be running on `http://localhost:3100` by default.

#### 7. Start Intake24 admin tool application

On `apps/admin` folder, run

```sh
pnpm dev
```

The Intake24 admin tool application should be running on `http://localhost:8100` by default, and you can log in using the admin account created during step 5.

#### 8. Start Intake24 frontend (survey) application

On `apps/survey` folder, run

```sh
pnpm dev
```

The Intake24 frontend (survey) application should be running on `http://localhost:8200` by default.

#### 9. Download food images and place them in the correct folder

Run the following command to download and extract the images:

```sh
pnpm cli init:food-images https://storage.googleapis.com/intake24/images/intake24-images-MRC-LIVE-19112025.zip
```

Refer to [Database -> Images](/guide/database#images) for more instructions.

## Useful tools

- IDE for developing Node, Typescript, npm (Intake24 use `pnpm` as drop-in replacement of npm) and associated tooling (e.g. VS Code)
- Docker, a clean and resource-efficient way to run PostgreSQL and Redis servers locally.
- Virtual Box (v6.x minimum) for running database VM
- Database browser (e.g. DBeaver) for exploring/manipulating PostgreSQL DB.
- Redis

::: tip
Intake24 requires node.js version 16 or newer, make sure to check your node.js version before continuing.
:::

Clone the [Intake24 version 4 repository on GitHub](https://github.com/intake24/intake24).

Follow the readme instructions in the root of the repository.

## API server

Go to `api` and follow instructions in the readme file.

Copy the `.env-template` file to `.env` and change the following settings:

- `JWT_ACCESS_SECRET` — set to any string (security doesn't matter for development purposes), e.g. `verybigsecret`,
- `JWT_REFRESH_SECRET` — same as above but use a different secret,
- `DB_CONNECTION_SSL` - set to `false` for if the instance is for development purpose
- `DB_SYSTEM_HOST` — set to `192.168.56.4` if using the development VM or alternatively point to your own database instance,
- `DB_SYSTEM_PORT`, `DB_SYSTEM_USERNAME`, `DB_SYSTEM_PASSWORD` — keep the default settings if using the VM or edit according to your own DB settings,
- `DB_FOODS_HOST` — set to `192.168.56.4` if using the development VM or alternatively point to your own database instance,
- `DB_FOODS_PORT`, `DB_FOODS_USERNAME`, `DB_FOODS_PASSWORD` — keep the default settings if using the VM or edit according to your own DB settings,
- `QUEUE_REDIS_HOST` — set to `192.168.56.4` if using the development VM or alternatively point to your own Redis instance.
- `APP_SECRET` - secret used to generate and verify admin logins. Use a different secret.
- `DB_DEV_SYSTEM_URL` and `DB_DEV_FOODS_URL` - set the connection strings according to your VM `192.168.56.4`, or alternatively point to your own database instance. If you are using docker compose script provided, PostgresQL DB will be installed locally, using default port `5432`, user name `postgres` and password `postgres`. The connection string will become something like `postgres://postgres:postgres@localhost:5432/{intake24 DB name}`
- `WEBPUSH_PUBLIC_KEY` and `WEBPUSH_PRIVATE_KEY` - check out [API server configuration](/config/api/services.md) to generate key pairs.

Check that the settings are correct by starting the server with `pnpm dev`.

:::tip
Add `DB_DEV_SYSTEM_DEBUG_QUERY_LIMIT=500` and `DB_DEV_FOODS_DEBUG_QUERY_LIMIT=500` to the API `.env` file to limit debug query char limit. It can prevent long queries from cluttering the console. The API server runs food indexing each time it starts so the console outputs can be quite a lot. The server does that for all locales in the food database, so for the DEV instance, you can also limit number of locales it runs against in `.env` by setting `APP_ENABLED_LOCALES = ["UK_V2_2022"]`.
:::

## API access

If you had your account already created in the databse snapshot you are using, add your email in DBeaver `users` tables, then go to `apps/cli`, and run `pnpm cli:dev hash-password yourNewPassword`.

Grab the hash and put it manually into the `password_hash` column of the `user_passwords` table for your user record (find you user_id in users).
There will be a cli command available to create a whole new account without this manual hassle.
