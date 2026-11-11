# Introduction

Intake24 implements Access control list (`ACL`) in two ways.

1. [Resources](/admin/acl/resources)
2. [Securables](/admin/acl/securables)

## Resources

Resource access is based on permissions. User with specific permission is gives access to whole resource-specific action = all records.

:::tip
User with permission `Edit surveys (surveys:edit)` can edit **any survey record**.
User with permission `Delete users (users:delete)` can delete **any user record**.
:::

Access to the resource section itself (e.g. `surveys`) is derived from these permissions, see [resource access permission](/admin/acl/resources#resource-access-permission).

## Securables

Securables allow to grant specific permission to per-record within the resource.
