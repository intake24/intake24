# Tasks

Tasks section allows to submit resource specific tasks into the job queue with additional parameters.

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

`SurveyNutrientsRecalculation` recalculates survey submission nutrient values with configurable modes for handling nutrient mapping references and field synchronization. This is useful when nutrient table data or food-to-nutrient mappings change.

### Parameters

```json
{
  "surveyId": string,
  "mode": "none" | "values-only" | "values-and-codes",
  "syncFields": boolean (optional, default: false)
}
```

### Quick Reference: Mode Matrix

This table shows what gets updated in submission data for each mode and `syncFields` combination:

| Aspect                                | `none` | `values-only`<br/>(syncFields: false) | `values-only`<br/>(syncFields: true) | `values-and-codes`<br/>(syncFields: false) | `values-and-codes`<br/>(syncFields: true) |
| ------------------------------------- | ------ | ------------------------------------- | ------------------------------------ | ------------------------------------------ | ----------------------------------------- |
| **Nutrient Values**                   | —      | → Existing only                       | → All                                | → Existing only                            | → All                                     |
| **Nutrient Entries**                  | —      | — (zeroes unresolvable)               | → Add new / remove dropped           | — (zeroes unresolvable)                    | → Add new / remove dropped                |
| **Nutrient Codes mappings**           | —      | —                                     | —                                    | → Updated                                  | → Updated                                 |
| **Field Value (e.g. sub-group code)** | —      | → Existing only                       | → All                                | → Existing only                            | → All                                     |
| **Field mappings**                    | —      | —                                     | → Add new / prune obsolete           | —                                          | → Add new / prune obsolete                |
| **Data Provenance**                   | N/A    | ✓ Preserved                           | ✓ Preserved                          | ⚠️ Mapping changed                         | ⚠️ Mapping changed                        |

### Decision Tree: Which Mode to Use?

```
 Are foods remapped to different nutrient compositions?
  ├─ YES → Use `values-and-codes` (±syncFields?)
  │        ├─ YES (with syncFields) → Full sync: new nutrients/fields added, dropped removed
  │        └─ NO (without syncFields) → Only existing nutrient/field values updated; unresolvable zeroed
  │
  └─ NO → Just nutrient values corrected?
     ├─ YES → Use `values-only` (±syncFields?)
     │        ├─ YES (with syncFields) → Full sync: new nutrients/fields added, dropped removed
     │        └─ NO (without syncFields) → Default: only existing values updated, structure preserved
     │
     └─ NO → No changes needed
        └─ Use `none` (dry-run/testing)

Note: This task does not rename foods or replace missing submission food codes with new codes.
```

Click [here](./survey-nutrients-recalculation-job) for detailed mode descriptions and use case examples.

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
