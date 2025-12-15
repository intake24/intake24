# Getting started

Section briefly describes how to configure, build and start the Intake24 components for development and production deployment.

## Prerequisites

- `Git`
- `Node.js` - latest LTS
- `pnpm` package manager
- 4vGB+ free disk space (Or 50GB+ free disk space including downloading and extracting food images and database snapshots)
- `PostgreSQL` and `Redis` instances

Options to set up local `PostgreSQL` and `Redis` instances:

#### Method 1: Docker compose

Execute Docker compose file `docker-compose.yml` to prepare PostgresQL and Redis instances, and map out port 5432 and 6379 respectively by default. More details can be found in [Development using Docker](/guide/docker.md).

#### Method 2: Virtual Machine

Run Dev VM (download from S3 bucket - contact the Intake24 team), which maps out the database on 192.168.56.10:5432 (PostgreSQL). More details can be found in [Development using VM](/guide/vm.md).

#### Method 3: Manual installation

Install `PostgreSQL` and `Redis` manually on your local machine. Refer to the official documentation for [PostgreSQL](https://www.postgresql.org/docs/current) and [Redis](https://redis.io/docs) for installation instructions.

## Development

#### 1. Clone repository

```sh
git clone https://github.com/intake24/intake24
```

More details can be found in [Source code](/guide/source-code) for detailed instructions about repository structure.

#### 2. Install pnpm using corepack

```sh
corepack enable

corepack install
```

More details can be found in [Source code -> Dependencies](/guide/source-code#dependencies).

#### 3. Install dependencies

On project root folder, run

```sh
pnpm install
```

#### 4. Spin up Redis and PostgreSQL instance

Make sure `Redis` and `PostgreSQL` instances are running and accessible.

Refer to [Services setup](#services-setup) section for options to set up local `PostgreSQL` and `Redis` instances.

#### 5. Initialise environment files

On project root folder, run below command to build the CLI application under folder using development configuration

```sh
pnpm cli init:env
```

This will create `.env` files under `apps/api`, `apps/cli`, `apps/admin` and `apps/survey` folders.

More details can be found in [CLI -> Initialize .env files](/cli/init-env).

Edit `.env` files as required. More details can be found in [Configuration](/config/) section.

#### 6. Populate system database

On project root folder, run below command

```sh
pnpm cli init:db:system
```

This will populate the system database with defaults. Follow the prompts to set up the admin user account.

More details can be found in [CLI -> Initialize system database](/cli/init-db-system).

#### 7. Run database migrations

Make sure databases are up to date running migration commands under project root folder:

```sh
pnpm db:migrate

# Shortcuts for individual databases

pnpm db:system:migrate
pnpm db:foods:migrate
```

More details can be found in [Database -> migrations](/guide/database#migrations).

#### 8. Download & extract food images

Run the following command and select to download and extract the images:

```sh
pnpm cli init:assets
```

More details can be found in [CLI -> Download assets](/cli/init-assets) and [Database -> Images](/guide/database#images) for more instructions.

#### 9. Start API server

On `apps/api` folder, run

```sh
pnpm dev
```

The API server should be running on `http://localhost:3100` by default.

#### 10. Start admin tool application

On `apps/admin` folder, run

```sh
pnpm dev
```

The Intake24 admin tool application should be running on `http://localhost:8100` by default, and you can log in using the admin account created during step 5.

#### 11. Start frontend (survey) application

On `apps/survey` folder, run

```sh
pnpm dev
```

The Intake24 frontend (survey) application should be running on `http://localhost:8200` by default.

## Production

Instead of running applications in development mode, you can build and start them in production mode.

Build the application

```sh
pnpm build
```

Start the application

```sh
pnpm start
```

:::tip For production, consider environment you plan to use to run the application:

1. Deploying as dedicated service. Refer to your OS environment how to set that up.
2. Use process manager, e.g. [PM2](https://pm2.keymetrics.io)
3. Deploy behind proper http server, e.g. [Nginx](https://www.nginx.com), [Apache](https://www.apache.org) etc.
   :::

Deployment section / ansible scripts provide examples how to use dedicated service on Ubuntu and run it behind Nginx reverse proxy.
