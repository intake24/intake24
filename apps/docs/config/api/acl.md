# Access control list (ACL)

Path: `packages/common-backend/src/acl/config.ts`

## Cache

Controls the permissions / roles caching

- object-path: `cache`

### Enabled

Enables / disables caching for permissions / roles.

- object-path: `cache.enabled`
- dotenv var: `ACL_CACHE_ENABLED`
- type: `boolean`
- default: `false`

### Expires in

Sets time the cache data expires at. Defined as `ms-formatted` string (see [ms](https://github.com/vercel/ms) for more information) or number in seconds.

- object-path: `cache.expiresIn`
- dotenv var: `ACL_CACHE_TTL`
- type: `number | string`
- default: `'7d'`

## Roles

List of special-purpose roles.

- object-path: `roles`

### Superuser

Any newly created permission will be associated with this role.

- object-path: `roles.superuser`
- type: `string`
- default: `'superuser'`

## Sign-up

Admin tool sign-up settings.

- object-path: `signup`

### Enabled

Enables / disables user sign-up (account creation) for Admin Tool.

- object-path: `signup.enabled`
- dotenv var: `ACL_SIGNUP_ENABLED`
- type: `boolean`
- default: `true`

### Permissions

List of permission names, that new account should be assigned with.

:::warning
Only stored permissions can be assigned (e.g. `surveys:browse`). Plain resource permissions (e.g. `surveys`) are derived, not stored, and are silently ignored. See [resource access permission](/admin/acl/resources#resource-access-permission).
:::

- object-path: `signup.permissions`
- dotenv var: `ACL_SIGNUP_PERMISSIONS` (`comma-delimited` string)
- type: `string[]`
- default: `[]`

### Roles

List of role names, that new account should be assigned with.

- object-path: `signup.roles`
- dotenv var: `ACL_SIGNUP_ROLES` (`comma-delimited` string)
- type: `string[]`
- default: `[]`
