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

## Record ownership

`Security` also allows to manage ownership of the record. Ownership can be added / modified / removed.

:::tip
If user `creates new record` or `copies existing record`, user automatically becomes the owner of the record.

Owner of the record has full access to the record, without the need to grant additional permissions from above table.
:::

## Record visibility

`Security` also allows to manage visibility of the record. Visibility can be added / modified / removed.

It is possible to set record visibility on following resources:

- [FAQ](/admin/surveys/faqs)
- [Languages](/admin/localization/languages)
- [Locales](/admin/localization/locales)
- [Feedback schemes](/admin/feedback/schemes)
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
