# Testing

Tests are set up with [Vitest](https://vitest.dev) framework.

All tests can be triggered from top-level repository structure.

::: warning
API Server integration test and some unit tests interacts with database, so be sure to set up empty testing databases and `__tests__/.env-test` file correctly. See below for more details.
:::

Tests are always located in `__tests__` folder in each `app` or `package` and use following directory structure convention. `__tests__` folder for `apps` has `unit` and `integration` subfolders as it will most likely have more then unit tests. While unit tests for `packages` are located directly in `__tests__`.

```
├─ apps
│  └─ {application}
│     └─ __tests__
│        ├─ unit
│           └─ my-function1.spec.ts
│        └─ integration
│           └─ my-function2.test.ts
├─ packages
   └─ {package}
      └─ __tests__
        └─ my-function3.spec.ts
```

## Unit tests

Use following commands to run unit tests across repository and trigger tests in `__tests__` folders and `__tests__/unit` folders for `packages` and `apps`, respectively. `Vitest` will search for all files with `.spec.ts` extension.

```sh
pnpm test:unit

pnpm test:unit:watch
```

## Integration tests

Integration tests can be run with following commands. At the moment, there are `API Server` and `Portal` integration tests, so it re-triggers the `app` internal command.

```sh
pnpm test:integration
```

## API Server

To run unit and integration tests on your local machine, start by copying your `.env` file to `__tests__/.env-test`.

Make sure to edit the `.env-test` file and change the database settings to point to test databases instead of your
normal development ones. The foods and system test databases should be empty databases with the necessary
extensions (e.g., `uuid-ossp`) installed.

:::danger
**Do not run any tests** unless you're sure that the database configuration settings in the `.env-test` file are
correct because the test framework setup code will **destroy all data** in those databases!
:::

If using the development VM, simply copy `__tests__/.env-test-dev-vm` to `__tests__/.env-test` and you're good to go.

Backend testing is set up for `unit` and `integration` tests. You can run tests with following commands.

Unit tests

```sh
pnpm test:unit
```

Unit tests watch for development

```sh
pnpm test:unit:watch
```

Integration tests

```sh
pnpm test:integration
```

Integration tests watch for development

```sh
pnpm test:integration:watch
```

## Admin & Survey apps

Front-ends use Vue.js vitest implementation, so you can run tests with:

```sh
pnpm test
```
