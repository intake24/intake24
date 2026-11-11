# Resources

Resource-based access control list implementation is based on three models:

- `user`
- `role`
- `permission`

## Database structure

Relations between the models are defined as follows:

- `many-to-many` between `user` and `role`
- `many-to-many` between `user` and `permission`
- `many-to-many` between `role` and `permission`

This allows to grant permissions to users in two ways:

- directly associate `permission` with `user`
- associate `permission` with `user` through `role` (acting as grouping record for a set of permissions)

Permissions need to be implemented on system-level and are usually distributed as database migration. Under normal circumstances, user won't need to create / modify / delete permission list.

## Resource permissions

Permissions formed from resource name and action (with `colon` character separator). Base actions are `browse`, `read`, `create`, `edit`, `delete`. Other resource-specific actions follows similar convention.

| Permission          | Description                     |
| ------------------- | ------------------------------- |
| resource:browse     | Browse / list resource records  |
| resource:read       | Read resource record details    |
| resource:create     | Create new resource record      |
| resource:edit       | Edit resource record            |
| resource:delete     | Delete resource record          |
| resource:media      | Control `media` permissions     |
| resource:securables | Control `securable` permissions |
| resource:[action]   | Specific resource record action |

## Resource access permission

Most resource endpoints are guarded by a plain `resource` permission (e.g. `surveys`, `faqs`), which grants access to the resource section of the Admin UI. This permission is **not stored** in the database and cannot be assigned. It is derived for the user from:

- any held `resource:[action]` permission (directly or through a role), e.g. `surveys:browse` implies `surveys`
- [securable](/admin/acl/securables) access to at least one record of the resource
- [ownership](/admin/acl/securables#record-ownership) of at least one record of the resource

:::tip
To remove user's access to a resource, remove all `resource:[action]` permissions, securables and record ownership for that resource. There is no separate `resource` permission to revoke.
:::

## Special purpose permissions

Current Intake24 ACL system also implements couple of V3-based specific permissions.

- `${surveyId}/respondent` - grants user respondent access to specific survey based on the `surveyId`, which is incorporated into permission name. Permission is automatically created when new survey record is created. `Survey Respondent` page allows to assign permission directly selected user. Whenever respondent record is created either using Admin UI or importing CSV file, this permission is attached directly to user.

- `globalsupport` - nominates user to receive respondents help request from all surveys.
