# Synchronize Access Control List (ACL)

This command allows to quickly synchronize the Access Control List (ACL) between the source code and the database.

This command is idempotent and can be safely run multiple times. It will:

- insert new permissions
- update existing permissions (e.g. description changes)
- assign all permissions to `superuser` role
- remove permissions that are no longer defined in the source code

:::tip
This command is automatically run during deployment process using Ansible roles, but it can be also run manually if needed.
:::

```sh
pnpm cli acl:sync
```
