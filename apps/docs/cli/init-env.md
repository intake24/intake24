# Initialize .env files

This command allows to quickly initialize `.env` files for each application (`api`, `admin`, `survey` and `cli`) when setting up the application for the first time.

It copies `.env-template` to `.env` and generates couple of application secrets + VAPID keys.

```sh
pnpm cli init:env
```
