# Introduction

All parts of the system are using environment variables. Environment specific configuration is parsed to `process.env` variables. All applications are using [`dotenv`](https://github.com/motdotla/dotenv) and [`dotenv-expand`](https://github.com/motdotla/dotenv-expand) to set environment variables.

Each `application` / `package` loads `.env` file in respective directory. There is an example file (`.env-template`) in each relevant directory, which can be used as template.

## Setting Up Your Environment

You have two options for creating your `.env` file:

### Option 1: Manual Clone

Copy the `.env-template` file in respective folder and modify the `.env` file as needed.

```sh
cp .env-template .env
```

### Option 2: CLI Generation

For a more streamlined approach, you can use our CLI tool to initialize .env files (each in `api`, `admin` and `survey` folder)

```sh
pnpm cli init-env
```

For detailed instructions on using the CLI, refer to our `.env` generation [guideline](/cli/init-env).
Choose the method that best suits your workflow and project needs.
