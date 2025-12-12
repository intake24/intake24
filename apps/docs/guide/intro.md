# Quick start introduction

Section briefly describes how to configure, build and start the Intake24 components for development and production deployment.

## Repository

Clone the repository

```sh
git clone https://github.com/intake24/intake24
```

Repository is set as mono-repository with [workspaces](https://pnpm.io/workspaces) using [pnpm](https://pnpm.io).

Shared components are in `packages` folder. Applications are in `apps` folder.

Install `pnpm` using corepack (see [pnpm docs](https://pnpm.io) for further options).

```sh
corepack enable

corepack install
```

Install project dependencies from repository root.

```sh
pnpm install
```

Set up `.env` file for each application you want to build, see below.

:::tip Environment variables
Code is using `.env ` environment files. Each application contains a template file (`.env-template`).

If you're setting up fresh project, you can run CLI command, which generates all the files and couple of required specific keys. Follow the [CLI instructions](/cli/) and how to run [init:env](/cli/init-env).

Some of the environment variables are either bundled in or used to configure build of SPA applications. Make sure you set up those `.env` file before running build for SPAs.
:::

```sh
# a) CLI to set up all applications
cd apps/cli
pnpm init:env

# b) OR manually navigate to each application folder and copy template

cd apps/{app}
cp .env-template .env
```

Edit `.env` files as required, see [configuration](/config/) section for detailed description of configuration options.

Build all applications

- run command either from top-level to build all applications (`api`, `cli`, `admin`, `portal` and `survey`).
- run command from `apps/{app}` folder to build specific application

```sh
pnpm build
```

## API Server

Navigate to `apps/api` directory.

```sh
cd apps/api
```

Copy template of configuration file and edit it as required. See [Configuration](/config/) section for detailed description of configuration options.

```sh
cp .env-template .env
```

### Development

Serve the application locally in development mode with hot-reload

```sh
pnpm dev
```

### Production

Build the application

```sh
pnpm build
```

Start the application

```sh
pnpm start
```

:::tip For production, consider

1. Deploying as dedicated service. Refer to your OS environment how to set that up.
2. User process manager, e.g. [PM2](https://pm2.keymetrics.io)
3. Deploy behind proper http server, e.g. [Nginx](https://www.nginx.com), [Apache](https://www.apache.org) etc.
   :::

Deployment section / ansible scripts provide examples how to use dedicated service on Ubuntu and run it behind Nginx reverse proxy.

## Database

- project is using [sequelize-cli](https://github.com/sequelize/cli)
- database layer is located in `packages/db`
- config / migration files (per database) are store in respective `packages/db/sequelize/{database}` folders

Set up `.env` file if running independently of API server so it can load connection details

```sh
cp .env-template .env
```

Migrations can be executed from root-level or package level with following commands

```sh
# both databases
pnpm db:migrate

# or each database

# foods
pnpm db:migrate:foods

# system
pnpm db:migrate:system
```

## Admin / Survey apps

Both applications are built as SPAs using [vite](https://vitejs.dev) and [vue](https://vuejs.org) - build toolchain pipeline is same for both.

Navigate to `apps/admin` or `apps/survey` directory depending on which application you want to build.

```sh
cd apps/{admin|survey}
```

Copy template of configuration file and edit it as required. See [Configuration](/config/) section for detailed description of configuration options.

```sh
cp .env-template .env
```

### Development

Serve the application locally in development mode with hot-reload

```sh
pnpm dev
```

### Production

Build the application

```sh
pnpm build
```

Start the application

```sh
pnpm start
```

:::tip
This should only be used if you host the client on separate domain. It will start separate http server to serve the application.
:::

## Documentation

Documentation is built with [vitepress](https://vitepress.vuejs.org).

Serve the application locally in development mode with hot-reload

```sh
pnpm docs:dev
```

:::tip
Documentation is automatically built and deployed to github pages whenever source code is updated.
:::
