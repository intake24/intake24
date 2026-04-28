# Roles

Roles resource allows to define groups, that can be associated with `permission` and `user` records. This allows to create a role with common permissions to be assigned to specific set of users without the needs to attach permissions directly to each user.

::: tip
Intake24 treats one specific role as `superuser` (name can be adjusted in [ACL Config](/config/api/acl)). Whenever new permission is created, it is assigned automatically to this role.
:::

## Properties

- `Name` - Unique role name within `role` records

- `Name` - Unique permission name within `permission` records

- `Display name` - User friendly role name

- `Description` - Free text, any role specific details

## Deletion

Deletion will also wipe `permission` and `user` related pivot table records.

::: warning
Do not delete `superuser` defined in [ACL Config](/config/api/acl) or you could loose access to the parts of the system.
:::
