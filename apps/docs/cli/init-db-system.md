# Initialize system database

This command will wipe existing and initializes the system database with fresh defaults.

:::danger
All existing data in the system database will be erased -> Use with caution.
:::

Following data will be populated:

- ACL roles and permissions
- Initial admin user
- System configuration settings
- Other essential system data

```sh
pnpm cli init:db:system
```

:::tip
This CLI expects `foods` and `system` databases are created already (which has typically been done during docker compose setup), and it will also invoke [cli:assets](/cli/init-assets.md) interactively to facilitate users to freshly download assets from the cloud storage and use during the initialization process.

Alternatively, you can specify your own snapshot files for foods and system databases during the interactive prompts.

Please also note that the `system` database initialization process requires the `foods` database to be already imported beforehand.
:::
