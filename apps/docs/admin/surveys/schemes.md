---
{ "outline": { "level": [2, 3] } }
---

# Survey schemes

Survey recall flow is defined by scheme, which has couple of sections.

## Detail

Detail tab displays selected survey scheme info.

## Create / Edit

Edit tab allows to modify selected survey scheme.

- `Name` - `survey-scheme-wide` unique name

- `Visibility` - Record visibility, valid options are `public` or `restricted` ([record visibility](/admin/acl/securables#record-visibility)).

### Settings

#### Type

Placeholder at the moment for future to allow to define various types of survey schemes

#### Flow

Recall flow, valid options are `1-pass` or `2-pass` (default).

- `1-pass` - Flow goes through each meal including foods portion size estimation in order to complete the meal
- `2-pass` - Flow goes through each meal two times
  - `first pass` - Flow goes through each meal to collect meal info and foods (without portion size estimation)
  - `second pass` - Flow goes through each meal to collect portion size estimation

#### Recall date offset

Recall date offset in whole days.

- `empty` - survey won't record recall date
- `integer` - survey records recall date with specified offset from start of survey (e.g. `-1` for yesterday)
- Respondent can override / nominate their own recall date if [`recall date prompt`](/admin/surveys/prompt-types#recall-date-prompt) is included in the scheme

#### Languages

Languages participants can select to complete the survey in.

#### Help

Help form configuration for the survey.

- `available fields` - List of fields available in help form
  - `name` - Name field
  - `email` - Email field
  - `phone` - Phone field
  - `message` - Message field

If no fields are selected, help form will be disabled.

- `required fields` - List of required fields in help form
  - `name` - Name field is required
  - `email` - Email field is required
  - `phone` - Phone field is required
  - `email|phone` - Email or Phone field is required
  - `message` - Message field is required

### Default meals

List of predefined meals that will appear at the start of the recall.

Section allows to manage default meal list.

- Create / edit / remove / re-arrange meals with default properties
- Load whole meal list from different scheme
- Reset the list to default one

#### Meal name

Localized meal name can be set up for each language.

#### Default time

Default meal time which is pre-filled in the recall.

#### Meal flags

Meal can be assigned with two type of flags:

- `standard flags` - flags that are used in the system with specific functionality
  - `meal-time:confirmed` - meal time is pre-confirmed using `default time` and user is not asked to confirm it
  - `meal-time:disabled` - meal time is not editable by user
  - `meal-time:hidden` - meal time is hidden (not visible in meal list UI)
- `custom flags` - flags that can be used for custom purposes, like prompt conditional logic

## Prompts

Prompts tab allows to design dietary survey recall flow and define details about each prompt asked.

Prompts are categorized to sections and they are asked in specified fixed order. See table below.

| Section       | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| 1. Pre-meal   | Prompts asked about whole recall before dietary data entered |
| 2. Pre-foods  | Prompts asked about meal before foods were entered           |
| 3. Foods      | Prompts asked about the foods                                |
| 4. Post-foods | Prompts asked about meal after foods were entered            |
| 5. Post-meal  | Prompts asked about whole recall after dietary data          |
| 6. Submission | Prompts asked during data submissions                        |

Whole prompt sections group can be loaded from another scheme using `load from scheme` button.

When prompt section is selected, list of prompts appear below:

- New prompts can be added
- Prompts can be removed
- List of prompts can be re-arranged by drag & drop
- Prompt can be loaded from `template` defined in `scheme prompts` section
- Prompt can be saved as `template` if it doesn't exist yet (determined by unique `prompt id`)
- Prompt's settings can be synced from `template` if it exists (determined by unique `prompt id`)

## Data export

Data export tab allows to define fields, which will get exported to flattened CSV file having `food-per-row` with all additional fields.

Data export fields are grouped to sections.

| Section                  | Description                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| User record fields       | `users` table row based fields                                                         |
| User custom fields       | `key:value` pairs from `user_custom_fields` table                                      |
| Survey record fields     | `surveys` table row based fields                                                       |
| Submission record fields | `survey_submissions` table row based fields                                            |
| Submission custom fields | `key:value` pairs from `survey_submission_custom_fields` table                         |
| Meal record fields       | `survey_submission_meals` table row based fields                                       |
| Meal custom fields       | `key:value` pairs from `survey_submission_meal_custom_fields` table                    |
| Food record fields       | `survey_submission_foods` and `survey_submission_missing_foods` table row based fields |
| Food custom fields       | `key:value` pairs from `survey_submission_food_custom_fields` table                    |
| Food composition fields  | `key:value` pairs from `nutrient_table_records_fields` table                           |
| Food nutrient fields     | `nutrient_types` table row based fields                                                |
| Portion size fields      | `key:value` pairs from `survey_submission_portion_size_fields` table                   |
| External source fields   | `survey_submission_external_sources` table row based fields                            |

Sections can be re-arranged by drag & drop and they will appear accordingly in export file.

Each section can be edited. Screen is divided in half to show included fields on left and available fields for inclusion on right.

Each field has:

- `Field ID` - unique field identifier to internal link the data
- `Field label` - customizable CSV column header in export file, if empty `Field ID` will be used

#### User record fields

- `userId` - unique user identifier, sequence number
- `name` - user name
- `simpleName` - transformed user name, stripped off any diacritic / accent characters
- `email` - user email
- `phone` - user phone number

#### User custom fields

User custom fields are key-value pairs, set up during respondent account creation.

#### Survey record fields

- `surveyId` - unique survey identifier, sequence number
- `username` - survey-unique respondent identifier attached to both user and survey record (aka `user survey alias`)
- `slug` - unique survey slug (code), which forms part of the survey URL (aka `https://intake24.org/{SLUG}/recall`)

#### Submission record fields

- `submissionId` - unique submission identifier, UUIDv4
- `recallDate` - client-recorded recall date using [recall-prompt](/admin/surveys/prompt-types#recall-date-prompt), ISO 8601 format
- `startTime` - client-recorded recall start time, ISO 8601 format
- `endTime` - client-recorded recall end time, ISO 8601 format
- `submissionTime` - server-recorded submission time, ISO 8601 format
- `recallDuration` - recall duration in mins (calculated value `endTime - startTime`, `truncate`-rounded)
- `userAgent` - client device [user agent header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent)
- `browser` - client device browser name (user-agent parsed)
- `engine` - client device browser engine name (user-agent parsed)
- `device` - client device name (user-agent parsed)
- `os` - client device operating system name (user-agent parsed)
- `cpu` - client device CPU architecture (user-agent parsed)

#### Submission custom fields

Submission-level custom data collected during the recall.

- `Field ID` is the unique `Prompt ID` set up in scheme prompts section

#### Meal record fields

- `mealIndex` - zero-based meal index in the recall generated during data-export based on sorted meal time
- `mealId` - unique meal identifier, UUIDv4
- `name` - meal name
- `time` - meal time (HH:mm)
- `duration` - meal duration (mins)

#### Meal custom fields

Meal-level custom data collected during the recall.

- `Field ID` is the unique `Prompt ID` set up in scheme prompts section

#### Food record fields

Contains `encoded food` and `missing food` records data

**Common fields**

- `foodIndex` - zero-based food index within a meal (includes encoded food and missing food records)
- `parentId` - unique food identifier of parent food, UUIDv4

**Food record fields**

- `foodId` - unique food identifier, UUIDv4
- `code` - Food code
- `englishName` - Food name (English)
- `localName` - Food name (local)
- `readyMeal` - Flag indicating if food is ready meal
- `searchTerm` - Search term used to find the food
- `reasonableAmount` - Flag indicating if food amount is reasonable
- `brand` - Food brand
- `barcode` - Food barcode
- `nutrientTableId` - Nutrient table identifier
- `nutrientTableCode` - Nutrient table code

**Missing Food record fields**

- `missingId` - unique missing food identifier, UUIDv4
- `missingName` - Missing food name
- `missingBrand` - Missing food brand
- `missingBarcode` - Missing food barcode
- `missingDescription` - Missing food description
- `missingPortionSize` - Missing food portion size
- `missingLeftovers` - Missing food leftovers

#### Food custom fields

Food-level custom data collected during the recall.

- `Field ID` is the unique `Prompt ID` set up in scheme prompts section

#### Food composition fields

List of available food composition fields from nutrient table

#### Food nutrient fields

List of available nutrient type fields

#### Portion size fields

List of portion size fields based on collection portion size methods

- `portion` - Stringified whole portion size object
- `portionMethod` - Portion size method ID
- `portionWeight` - Calculated portion weight (`servingWeight` - `leftoversWeight`)
- `servingWeight` - Food weight in grams
- `leftoversWeight` - Leftovers weight in grams

#### External source fields

List of external source fields. Data can be collected from multiple sources, so Field IDs are in format `{source}:{field}`.

- `{source}:id` - unique external source identifier, UUIDv4
- `{source}:source` - source identifier (e.g. `'open-food-facts'`)
- `{source}:searchTerm` - unique external source identifier, UUIDv4
- `{source}:type` - selection type (`'selected' | 'missing'`)
- `{source}:data` - json serialized external source data
- `{source}:data.path.to.field` - `dot-notation` json path to extract field value
