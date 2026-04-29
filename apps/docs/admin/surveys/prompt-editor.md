# Prompt editor

Full screen modal opens when `add` or `edit` button is clicked.

Top level toolbar has:

- `Cancel` button on the left - prompt changes are discarded
- `Confirm` button on the right - prompt changes are confirmed, but not yet saved to server's database
- Tab list with:
  - `General` - Prompt type & id & name of the prompt `internal-only` purposes
  - `Content` - Localized prompt content fields
  - `Conditions` - Conditions list to be met to display the prompt
  - `Validation` - Validation options, i.e. prompt is optional or required
  - `Options` - Additional per-prompt type options

## General

General tab defines administrative fields

- `Type` - Prompts are categorized to three types:
  - [custom prompts](/admin/surveys/prompt-types#custom-prompts)
  - [standard prompts](/admin/surveys/prompt-types#standard-prompts)
  - [portion size prompts](/admin/surveys/prompt-types#portion-size-prompts)

- `ID` - `scheme-unique` ID assigned to prompt

::: tip Prompt ID usage

- Prompt ID of custom prompt is used as identifier in data exports file. It is also used to identify prompt in the scheme.
- Prompt ID is used to load prompt from `template` and to sync prompt properties from `template`.
  :::

- `Name` - User friendly name for easier orientation (for internal use only).

- `Group` - Group identifier for grouping prompts in the scheme section together.
  - available for [custom prompts only](/admin/surveys/prompt-types#custom-prompts)
  - prompts with the same group are displayed together on same screen collapsed in expansion panels
  - prompts conditions are merged together and evaluated as one condition list for the whole group

## Content

Content tab defines respondent facing content text fields and their localized versions.

- `Name` - Short prompt name displayed in top breadcrumbs component
- `Text` - Text displayed in the header component just below the breadcrumb (usually defaults to blank)
- `Description` - Main body of prompt details, which allows to embed `rich-text` content

All fields can be localized to [languages](/admin/system/languages) set up in the database.

Following variables can be used in the fields:

- `{meal}` - Meal name & time (e.g. `Breakfast (12:00)`)
- `{mealName}` - Meal name (e.g. `Breakfast`)
- `{mealTime}` - Meal time (e.g. `12:00`)
- `{food}` - Food name (e.g. `Bread`)
- `{item}` - Food name or Meal name depending on current selection of prompt level type
- `{recallDate}` - Recall date (e.g. `2023-01-01`)
- `{recallNumber}` - Current recall number
- `{userName}` - User's name (if available)

## Actions

Actions tab defines list of actions to be performed when prompt is displayed.

- `Enable custom prompt actions` - flag whether to enable custom prompt actions defined in this list
- `Display both layout actions in mobile UI` - flag whether to display `desktop` actions also in `mobile` UI below the prompt content

### Actions options

- `type` - type of action that should happen when button is clicked
- `layout` - layout of where the button should be displayed (`desktop` or `mobile`)
- `variant` - style variant (`elevated`, `outlined`, `text`)
- `color` - color variant (`primary`, `secondary`, `success`, `warning`, `error`, color hex code)
- `icon` - icon, [existing alias](https://github.com/intake24/intake24/blob/master/apps/survey/src/plugins/vuetify.ts) or [FontAwesome](https://fontawesome.com/search?o=r&m=free) icon name
- `text` - localized text to be displayed on the button
- `label` - option localized label to be displayed on the button tooltip. If not specified, `text` is used instead.

## Conditions

Conditions tab defines list of conditions that needs to be met to display the prompt.

- If conditions is empty, prompt is always displayed.
- If conditions is not empty, prompt is only displayed once all conditions are met.

### Type

| Type              | Status                                           | Description                                                                |
| ----------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `Drinks`          | deprecated (use `Number of foods` with category) | Number of drinks (in `meal` or `survey`)                                   |
| `Energy`          | active                                           | Total energy (`food` / `meal` / `survey`)                                  |
| `ExternalSource`  | active                                           | Status of external source data collection for particular food              |
| `Flag`            | active                                           | Whether `food` / `meal` / `survey` has a specific flag                     |
| `Food category`   | active                                           | Whether `food` has the category assigned                                   |
| `Food completion` | active                                           | Whether `food` is completed                                                |
| `Meal completion` | active                                           | Whether `meal` is completed                                                |
| `Number of foods` | active                                           | Number of foods in recall / meal / food with optional properties to filter |
| `Number of meals` | active                                           | Number of meal in recall / meal with optional properties to filter         |
| `Prompt answer`   | active                                           | `Food` / `meal` / `survey` prompt answer                                   |
| `Recall`          | deprecated (use `User field` with `submissions`) | Current recall number                                                      |
| `User field`      | active                                           | `name`, `submissions` custom field                                         |

### Operation

Each condition can be set with one of the following operations:

| Operation | Value type         | Description                                                    |
| --------- | ------------------ | -------------------------------------------------------------- |
| `eq`      | string \| string[] | Condition value equals to defined value                        |
| `nt`      | string \| string[] | Condition value does not equal to defined value                |
| `in`      | string \| string[] | One of the condition values is included defined value-list     |
| `notIn`   | string \| string[] | None of the condition values is included in defined value-list |
| `gte`     | number             | Condition value is greater than or equals to defined value     |
| `gt`      | number             | Condition value is greater than defined value                  |
| `lte`     | number             | Condition value is lower than or equals to defined value       |
| `lt`      | number             | Condition value is lower than defined value                    |

### Section

Several condition type can define entity-level where to look for the answer:

- `survey` - looks for the answer in the survey state
- `meal` - looks for the answer in the meal state
- `food` - looks for the answer in the food state

## Validation

Validation tab defines validation options, i.e. whether prompt is optional or required.

## Options

Options tab defines additional per-prompt type options. See [Prompt types](/admin/surveys/prompt-types) for more details.

## JSON

Raw JSON prompt editor. Can be used for manual editing, copy-pasting between prompts / schemes etc.
