# Update guide

This guide provides instructions on how to update your environment with latest changes from source code.

## Pull latest changes

Pull the latest changes from the main branch to ensure your local environment is up to date with the latest source code.

```sh
git pull origin main
```

## Update dependencies

Update dependencies to ensure you have the latest versions required by the updated source code.

```sh
pnpm install
```

## Database migrations

Run database migrations to update your local database schema to match the latest changes in the source code.

```sh
pnpm db:migrate

# Shortcut for following commands:
pnpm db:system:migrate
pnpm db:foods:migrate
pnpm acl:sync
```

## Trigger jobs to re-sync schemas

Depending what changes have been pulled, you may need to trigger some background jobs to re-sync schemas.

This includes following jobs:

- `FeedbackSchemesSync` - to re-sync feedback schemes
- `SurveySchemesSync` - to re-sync survey schemes
- `LanguageTranslationsSync` - to re-sync DB-based language translations (if any)
