# Users

Users resource defines primary user records.

## Properties

- `Name` - User name

- `Email` - Valid email address, allows login to admin tool and restore password functionality

- `Phone` - Phone number

- `Assigned roles` - Roles user is assigned with. Grants permissions based on the role settings

- `Assigned permissions` - Permissions user is **directly** assigned with (not through the `role`)

::: tip Survey-based permissions
When setting up survey-related users, it's better to handle permissions through Survey UI. For setting up system users, it's better to use roles as there are usually more people that will require similar set of permissions and it's then easier to manage through role rather than individually through each user/permission.
:::

- `Multi-factor authentication` - Turns `on` / `off` multi-factor authentication for specific user. This firstly needs to be enabled on system level and correctly configured with 3rd party provider.

- `Verified` - User verification status. Verified user can log in to admin tool and use the system. Unverified user cannot log in to admin tool and is treated as non-existing user in the system.

- `Disabled` - User disabled status. Disabled user cannot log in to admin tool and is treated as non-existing user in the system.

- `Email notifications` - To be clarified

- `SMS notifications` - To be clarified
