# Permissions

Permissions resource defines system-level implemented access control.

::: warning
Permissions are managed through database migrations to ensure correct system functionality as they are tied to source code implementation. Usually, there is no need to `create` / `edit` / `delete` any of the permission records.
:::

## Properties

- `Name` - Unique `slug-based` permission name within `permission` records

- `Display name` - User friendly permission name

- `Description` - Free text, any permission specific details

## Deletion

`System-level` defined permission can prevent normal functionality, loosing access to various parts of the system. So should be treated as such. Deletion will also wipe `role` and `user` related pivot table records.
