# Securables

Following resources / record types implement `securable` per-record access.

- `FAQ`
- `Feedback scheme`
- `Language`
- `Locale`
- `Survey scheme`
- `Surveys`

Securable permissions can be granted / revoked for any specific record in `Security` tab of the record.

`Security` tab allows to control:

<!-- prettier-ignore -->
- [Securables](#securables)
  - [Securable permissions](#securable-permissions)
    - [Assigning users](#assigning-users)
  - [Record ownership](#record-ownership)
  - [Record visibility](#record-visibility)
    - [Visibility types](#visibility-types)
      - [Public](#public)
      - [Restricted](#restricted)

## Securable permissions

| Permission | Description                     |
| ---------- | ------------------------------- |
| browse     | Browse / list record            |
| read       | Read record details             |
| edit       | Edit record                     |
| delete     | Delete record                   |
| media      | Control `media` permissions     |
| securables | Control `securable` permissions |
| use        | Control record `visibility`     |
| [action]   | Specific record action          |

Securable access to any record of the resource also gives user the [resource access permission](/admin/acl/resources#resource-access-permission), so the resource section is available in the Admin UI. When last securable access is removed (or the record is deleted) and user doesn't own any other record of the resource, resource access is removed as well.

### Assigning users

User lookup in `Security` tab searches only users, who can be given the access:

- users with `users:browse` permission can search by part of name or email
- other users need to enter the **exact email address** of the user

Survey respondents (users with respondent access only, without any other permission or securable access) are never listed and cannot be given securable access or record ownership.

Adding user by email, which already belongs to existing user, grants the access to that user instead of creating a new account.

Users managing securable permissions can only add or remove actions they hold themselves (resource permissions or securable permissions of the record). Removing user's access completely is only possible if the user doesn't hold any action, which the managing user doesn't hold. Record owner can manage all actions.

## Record ownership

`Security` also allows to manage ownership of the record. Ownership can be added / modified / removed.

Ownership can only be changed by the current owner of the record or by users with `resource:securables` permission. `securables` securable permission of the record does not allow changing the ownership.

:::tip
If user `creates new record` or `copies existing record`, user automatically becomes the owner of the record.

Owner of the record has full access to the record, without the need to grant additional permissions from above table.
:::

Ownership of any record of the resource also gives user the [resource access permission](/admin/acl/resources#resource-access-permission).

## Record visibility

`Security` also allows to manage visibility of the record. Visibility can be added / modified / removed.

It is possible to set record visibility on following resources:

- [FAQ](/admin/system/faqs)
- [Languages](/admin/system/languages)
- [Locales](/admin/locales/)
- [Feedback schemes](/admin/system/feedback-schemes)
- [Survey schemes](/admin/surveys/schemes)

### Visibility types

Visibility defines if record can be used, i.e. assigned to other records. For example:

- `Language` can be assigned to `Locale`
- `Locale` can be assigned to `Survey`
- `FAQ` / `Feedback scheme` / `Survey scheme` can be assigned to `Survey`

#### Public

Public visibility means that record is visible for the use to all users.

#### Restricted

Restricted visibility means that record is visible for the use to users

1. with `resource:use` permission granted
2. with `use` securable granted
