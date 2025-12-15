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
Command requires food database and system database to be already imported. You can use [CLI command](/cli/init-assets.md) to download and restore the system database snapshot.
:::
