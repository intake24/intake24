# Job types

Jobs types available in system.

- [Job types](#job-types)
  - [CleanRedisStore](#cleanredisstore)
  - [CleanStorageFiles](#cleanstoragefiles)
  - [FeedbackSchemesSync](#feedbackschemessync)
  - [LanguageTranslationsSync](#languagetranslationssync)
  - [LocaleCopy](#localecopy)
  - [LocaleFoods](#localefoods)
  - [LocaleFoodNutrientMapping](#localefoodnutrientmapping)
  - [LocaleFoodRankingUpload](#localefoodrankingupload)
  - [NutrientTableDataImport](#nutrienttabledataimport)
  - [NutrientTableMappingImport](#nutrienttablemappingimport)
  - [PopularitySearchUpdateCounters](#popularitysearchupdatecounters)
  - [PurgeExpiredTokens](#purgeexpiredtokens)
  - [Resource export](#resource-export)
  - [SurveyAuthUrlsExport](#surveyauthurlsexport)
  - [SurveyDataExport](#surveydataexport)
  - [SurveyFeedbackNotification](#surveyfeedbacknotification)
  - [SurveyHelpRequestNotification](#surveyhelprequestnotification)
  - [SurveyNutrientsRecalculation](#surveynutrientsrecalculation)
  - [SurveyRatingsExport](#surveyratingsexport)
  - [SurveyRespondentsImport](#surveyrespondentsimport)
  - [SurveySchemesSync](#surveyschemessync)
  - [SurveySessionsExport](#surveysessionsexport)
  - [SurveySubmission](#surveysubmission)
  - [SurveyEventNotification](#surveyeventnotification)
  - [UserPasswordResetNotification](#userpasswordresetnotification)
  - [UserEmailVerificationNotification](#useremailverificationnotification)

## CleanRedisStore

`CleanRedisStore` wipes the specific redis stores. e.g. `cache` or `session`

```json
{
  "store": "cache" | "session"
}
```

## CleanStorageFiles

`CleanStorageFiles` wipes temporary storage files, e.g. `downloads` and `uploads` folders.

```json
{}
```

## FeedbackSchemesSync

`FeedbackSchemesSync` synchronizes existing feedback schemes with default values.

:::tip
This needs to be run if feedback scheme structure changes, e.g. new non-optional properties are added, so all database records are synced to use same structure.
:::

```json
{}
```

## LanguageTranslationsSync

`LanguageTranslationsSync` synchronizes database language translation records with built-in English translation.

:::tip Built-in translations update
This needs to be run if object structure changes, so all database records are synced to use same structure.
:::

```json
{}
```

## LocaleCopy

`LocaleCopy` copies locale data from specified source locale based on included subtasks.

:::danger Data loss warning
This will delete any existing data for each included subtask before copying over new data from source locale.
:::

**Food database subtasks:**

- associated foods
- brands
- categories
- foods
- food groups
- recipe foods
- split lists
- split words
- synonym sets

**System database subtasks:**

- search - popularity
- search - fixed ranking

```json
{
  "localeId": string,
  "sourceLocaleId": string,
  "subTasks": string[]
}
```

## LocaleFoods

`LocaleFoods` exports foods data for selected locale.

```json
{
  "localeId": string,
}
```

## LocaleFoodNutrientMapping

`LocaleFoodNutrientMapping` exports food nutrient mapping data for selected locale.

```json
{
  "localeId": string,
}
```

## LocaleFoodRankingUpload

`LocaleFoodRankingUpload` uploads food ranking data for selected locale.

```json
{
  "localeId": string,
  "file": File
}
```

## NutrientTableDataImport

`NutrientTableDataImport` imports data from CSV file containing nutrient data.

```json
{
  "nutrientTableId": string,
  "file": File
}
```

## NutrientTableMappingImport

`NutrientTableMappingImport` imports Excel-based nutrient mappings from CSV file.

```json
{
  "nutrientTableId": string,
  "file": File
}
```

**Expected file type** - `text/csv`

| Column                       | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| Intake24 nutrient ID         | [Intake24 nutrient type ID](/admin/foods/nutrient-types) |
| NDB spreadsheet column index | Excel-based column name                                  |

## PopularitySearchUpdateCounters

`PopularitySearchUpdateCounters` increments popularity search counters based on provided food codes from survey submission.

```json
{
  "localeCode": string,
  "foodCodes": string[]
}
```

## PurgeExpiredTokens

`PurgeExpiredTokens` cleans expired `personal access` and `refresh` tokens, that don't need to be hold in database store anymore.

```json
{}
```

## Resource export

`ResourceExport` allows to export specific resource data as CSV-file.

```json
{
  "resource": string,
}
```

**Exportable resources**

- As served sets
- As served set images
- Drinkware sets
- Drinkware set scales
- Drinkware set volumes
- Food groups
- Guide images
- Guide image objects
- Image maps
- Image map objects
- Languages
- Locales
- Nutrient types
- Standard units

## SurveyAuthUrlsExport

`SurveyAuthUrlsExport` exports survey respondent authentication details (usernames and authentication URLs).

```json
{
  "surveyId": string
}
```

## SurveyDataExport

`SurveyDataExport` exports survey submission data to CSV file based on scheme-defined export columns.

```json
{
  "id"?: string | string[],
  "surveyId": string,
  "startDate"?: string,
  "endDate"?: string,
  "userId"?: string
}
```

## SurveyFeedbackNotification

`SurveyFeedbackNotification` sends email with attached survey feedback PDF file to provided email address.

```json
{
  "surveyId": string,
  "username": string,
  "submissions"?: string[],
  "to": string,
  "cc"?: string,
  "bcc"?: string
}
```

## SurveyHelpRequestNotification

`SurveyHelpRequestNotification` sends request help email to study support users.

```json
{
  "surveySlug": string,
  "userId": string,
  "name": string,
  "email": string,
  "phone": string,
  "phoneCountry": string,
  "message": string
}
```

## SurveyNutrientsRecalculation

`SurveyNutrientsRecalculation` recalculates survey submission nutrients. This is useful when nutrient table data changes and need to recalculate all survey submissions.

```json
{
  "surveyId": string
}
```

## SurveyRatingsExport

`SurveyRatingsExport` exports survey ratings data to CSV file.

```json
{
  "surveyId": string
}
```

## SurveyRespondentsImport

`SurveyRespondentsImport` imports survey respondent records from provided CSV file.

```json
{
  "surveyId": string,
  "file": File
}
```

**Available columns**

| Column   | Description | Record          | Note                                                       |
| -------- | ----------- | --------------- | ---------------------------------------------------------- |
| username | Required    | UserSurveyAlias | Unique survey respondent identifier                        |
| password | Optional    | UserPassword    | Min 10 chars length, including lower/upper-case and number |
| name     | Optional    | User            | Optional user's name for personalization                   |
| email    | Optional    | User            |                                                            |
| phone    | Optional    | User            |                                                            |
| \*       | Optional    | UserCustomField |                                                            |

:::tip User custom fields
Any additional column not listed above, will get stored as `UserCustomField` record, which is `key` -> `value` record in database table.
:::

## SurveySchemesSync

`SurveySchemesSync` synchronizes existing survey schemes with default values.

:::tip
This needs to be run if survey schemes structure changes, e.g. new non-optional properties are added, so all database records are synced to use same structure.
:::

```json
{}
```

## SurveySessionsExport

`SurveySessionsExport` exports survey sessions - partial recall data to CSV file.

```json
{
  "surveyId": string
}
```

## SurveySubmission

`SurveySubmission` processes submission state and saves data.

```json
{
  "surveyId": string,
  "userId": string,
  "state": SurveyStatus
}
```

## SurveyEventNotification

`SurveyEventNotification` is used to dispatch survey event notifications.

```json
{
  "type": "survey.session.started" | "survey.session.cancelled" | "survey.session.submitted",
  "sessionId": string,
  "surveyId": string,
  "userId": string,
  "submissionId?": string
}
```

When valid `notification` is set in survey settings, job is called for corresponding event.

If [survey external communication](/admin/surveys/#external-communication) specifies JWT secret, signed JWT token is attached as Bearer in `Authorization` header of the request.

Request

```http
POST https://my-submission-notification-url.example.com

Authorization: Bearer {token}
Content-Type: application/json

{
    ...
}
```

## UserPasswordResetNotification

`UserPasswordResetNotification` is triggered when user requests password reset.

```json
{
  "email": string,
  "userAgent"?: string
}
```

## UserEmailVerificationNotification

`UserEmailVerificationNotification` is triggered when new user signs up.

```json
{
  "email": string,
  "userAgent"?: string
}
```
