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
    - [Parameters](#parameters)
    - [Quick Reference: Mode Matrix](#quick-reference-mode-matrix)
    - [Database Fields Updated](#database-fields-updated)
    - [Detailed Mode Descriptions](#detailed-mode-descriptions)
      - [`none`](#none)
      - [`values-only` (Default)](#values-only-default)
    - [Decision Tree: Which Mode to Use?](#decision-tree-which-mode-to-use)
    - [Decision Tree: Which Mode to Use?](#decision-tree-which-mode-to-use-1)
    - [Important Considerations](#important-considerations)
      - [Data Provenance \& Audit Trail](#data-provenance--audit-trail)
      - [Edge Cases Handled](#edge-cases-handled)
      - [Performance Considerations](#performance-considerations)
    - [Mode Combination Summary Table](#mode-combination-summary-table)
    - [Use Case Examples](#use-case-examples)
      - [Example 1: Nutrient Value Correction](#example-1-nutrient-value-correction)
      - [Example 2: New Nutrient Field Added](#example-2-new-nutrient-field-added)
      - [Example 3: Food Remapped to Better Nutrient Record](#example-3-food-remapped-to-better-nutrient-record)
      - [Example 4: Complete Food Database Update](#example-4-complete-food-database-update)
      - [Example 5: Dry-Run / Testing Configuration](#example-5-dry-run--testing-configuration)
    - [Job Output](#job-output)
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

:::tip Subtask processing
Each subtask will firstly delete any existing data and then copies over data from specified source locale.
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

This table shows what gets updated for each mode and `syncFields` combination:

| Aspect               | `none` | `values-only`<br/>(syncFields: false) | `values-only`<br/>(syncFields: true) | `values-and-codes`<br/>(syncFields: false) | `values-and-codes`<br/>(syncFields: true) |
| -------------------- | ------ | ------------------------------------- | ------------------------------------ | ------------------------------------------ | ----------------------------------------- |
| **Nutrient Values**  | ❌     | ✅                                    | ✅                                   | ✅                                         | ✅                                        |
| **Nutrient Codes**   | ❌     | ❌                                    | ❌                                   | ✅                                         | ✅                                        |
| **Food Codes/Names** | ❌     | ❌                                    | ❌                                   | ❌                                         | ❌                                        |
| **Field Sync**       | ❌     | ❌                                    | ✅                                   | ❌                                         | ✅                                        |
| **Data Provenance**  | N/A    | ✅ Preserved                          | ✅ Preserved                         | ⚠️ Changed                                 | ⚠️ Changed                                |

### Database Fields Updated

**Core submission data objects and properties affected** (depends on mode):

| Model → Property                         | Type         | Updated in Modes                                        |
| ---------------------------------------- | ------------ | ------------------------------------------------------- |
| `SurveySubmissionFood.nutrients`         | JSONB object | All modes except `none`                                 |
| `SurveySubmissionFood.nutrientTableCode` | String       | `values-and-codes`, `values-and-codes+syncFields`       |
| `SurveySubmissionFood.nutrientTableId`   | String       | `values-and-codes`, `values-and-codes+syncFields`       |
| `SurveySubmissionFood.fields`            | JSONB object | `values-only+syncFields`, `values-and-codes+syncFields` |

`SurveySubmissionFood.code`, `SurveySubmissionFood.englishName`, and `SurveySubmissionFood.localName` are not changed by this task in any mode.

**How data is stored:**

- Nutrient values are stored as key-value pairs in `SurveySubmissionFood.nutrients` JSONB object (key: nutrient ID, value: amount)
- Field values are stored as key-value pairs in `SurveySubmissionFood.fields` JSONB object (key: field ID, value: field value)

### Detailed Mode Descriptions

#### `none`

**No changes made.** This is a safety mode - the job completes without modifying any submission data.

**Use when:**

- Testing the job configuration
- Dry-run verification against live survey data
- Auditing job parameters before actual execution

**Example:**

```json
{
  "surveyId": "59",
  "mode": "none"
}
```

**Database impact:** None

---

#### `values-only` (Default)

**Updates nutrient amounts using original nutrient codes.** Keeps the historical reference to nutrient composition data from submission time.

**What is recalculated:**

For each `SurveySubmissionFood`:

1. Keep the original `nutrientTableCode` and `nutrientTableId` (historical reference preserved)
2. Recalculate values in `nutrients` JSONB object using current `unitsPer100g` from the nutrient record
3. Recalculate nutrient amounts with updated composition data

**What remains unchanged:**

- Food code (`code`) and names (`englishName`, `localName`)
- Nutrient table references (`nutrientTableId`, `nutrientTableCode` )
- Field structure in `fields` JSONB object

**Use when:**

- Nutrient composition values have been corrected (e.g., Vitamin C updated from 50mg to 52mg)
- Same nutrient records still apply to foods
- You want to preserve historical food-to-nutrient mappings

**Example 1: Values corrected in nutrient table**

```json
{
  "surveyId": "59",
  "mode": "values-only",
  "syncFields": false
}
```

### Decision Tree: Which Mode to Use?

```
SurveySubmissionFood {
  code: "CHICK1"
  englishName: "Chicken, raw"
  localName: null
  nutrientTableId: "NDNS_2016"
  nutrientTableCode: "0500"
  nutrients: {
    "1": 165,       // Energy
    "3": 31         // Protein
  },
  fields: {
    "sub_group_code": "51R"
  }
}
```

After recalculation (everything updated):

```
SurveySubmissionFood {
  code: "CHICK1"  ← SAME
  englishName: "Chicken, raw"  ← SAME
  localName: null
  nutrientTableId: "NDNS_2016"  ← SAME ID
  nutrientTableCode: "0510"  (UPDATED: remapped)
  nutrients: {
    "1": 165,       // UPDATED: Energy recalculated
    "3": 31,        // UPDATED: Protein recalculated
    "6": 3.6,       // ADDED: Fat (new availability)
    "44": 27        // ADDED: Selenium (new in table)
  },
  fields: {
    "sub_group_code": "51R"  // UPDATED: based on current nutrient table
  }
}
// Nutrient mappings/values/fields updated - food identity unchanged
```

### Decision Tree: Which Mode to Use?

```
┌─ Are foods remapped to different nutrient compositions?
│  ├─ YES → Use `values-and-codes` (±syncFields?)
│  │        ├─ YES (with syncFields) → New nutrients/fields added
│  │        └─ NO (without syncFields) → Keep existing fields
│  │
│  └─ NO → Just nutrient values corrected?
│     ├─ YES → Use `values-only` (±syncFields?)
│     │        ├─ YES (with syncFields) → New nutrients/fields added
│     │        └─ NO (without syncFields) → Default, preserve existing mappings
│     │
│     └─ NO → No changes needed
│        └─ Use `none` (dry-run/testing)

Note: This task does not rename foods or replace missing submission food codes with new codes.
```

### Important Considerations

#### Data Provenance & Audit Trail

| Aspect                      | `none`                       | `values-only`                | `values-and-codes`           |
| --------------------------- | ---------------------------- | ---------------------------- | ---------------------------- |
| **Nutrient records change** | No                           | No                           | ✅ Yes                       |
| **Field structure changes** | No<br/>(if syncFields=false) | No<br/>(if syncFields=false) | No<br/>(if syncFields=false) |
| **Food references change**  | No                           | No                           | No                           |
| **Audit trail impact**      | None                         | ✅ Safe                      | ⚠️ Records differ            |
| **Before re-running**       | N/A                          | Optional                     | ✅ Backup                    |

**Recommendation:** Before using `values-and-codes` mode on production surveys:

1. Back up submission data
2. Test on a copy first
3. Document the reason in survey notes
4. Keep audit logs of changes

#### Edge Cases Handled

The job processes these situations gracefully:

| Situation                                                               | Behavior                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Food code not found in foods DB**                                     | No replacement inference (`X` is not replaced by `Y`)                                |
| **Food not found in database (mapping-required modes)**                 | Skipped with warning, original data retained                                         |
| **Food not found in database (`values-only` with `syncFields: false`)** | Recalculation can still proceed using stored `nutrientTableId` / `nutrientTableCode` |
| **Nutrient record deleted or dissociated**                              | ⚠️ **Clears nutrients and fields**; logs warning; continues processing               |
| **Food has no current nutrient mappings**                               | Skipped with warning                                                                 |
| **Multiple nutrient mappings for food**                                 | Uses first mapping (consistent with submission)                                      |
| **Field definition changed type**                                       | Removed in sync operation                                                            |
| **Nutrient value is zero**                                              | Kept as zero (valid value)                                                           |

**Important: Deleted Nutrient Records**

When a nutrient variable is dropped from a nutrient table during an update, the cleanest approach is to drop that variable from all recalls (including those submitted prior to the update) where recalculation is performed. The job will:

1. Detect when a nutrient record no longer exists or is no longer associated with a food
2. Clear the `nutrients` and `fields` objects for those submission foods
3. Log a warning message identifying affected submissions
4. Continue processing remaining submissions
5. Report count of cleared submissions in the job summary

This ensures that historical data does not reference obsolete nutrient compositions.

#### Performance Considerations

- Processes foods in batches of 100
- Progress tracking updates incrementally
- Job completion message includes statistics
- Large surveys (10,000+ submissions) may take several minutes

### Mode Combination Summary Table

**Quick reference for all valid combinations:**

| Scenario                  | Mode               | syncFields | Preserves Mapping | Updates Fields | Scope                   |
| ------------------------- | ------------------ | ---------- | ----------------- | -------------- | ----------------------- |
| **Testing**               | `none`             | N/A        | ✅ Yes            | ❌ No          | None                    |
| **Value corrections**     | `values-only`      | `false`    | ✅ Yes            | ❌ No          | Values only (minimal)   |
| **Values + new fields**   | `values-only`      | `true`     | ✅ Yes            | ✅ Yes         | Values + field sync     |
| **Remapped foods**        | `values-and-codes` | `false`    | ❌ No             | ❌ No          | Values + codes          |
| **Remapped + new fields** | `values-and-codes` | `true`     | ❌ No             | ✅ Yes         | Values + codes + fields |

### Use Case Examples

#### Example 1: Nutrient Value Correction

**Problem:** Vitamin C content for commonly-submitted foods was inaccurate in NDNS database. The values have now been corrected (e.g., Orange from 50mg→59mg per 100g).

**Survey context:**

- 2,000 submitted oranges in collection
- Current mapping and fields are fine
- Only nutrient values need updating

**Solution:**

```json
{
  "surveyId": "59",
  "mode": "values-only",
  "syncFields": false
}
```

**Result:**

- ✅ Nutrient values in `nutrients` object recalculated
- ✅ Original `nutrientTableCode` and `nutrientTableId` preserved (historical accuracy)
- ✅ No `fields` object changes
- ✅ `code` and names unchanged

**Before/After:**

```
SurveySubmissionFood {
  code: "ORANGE"
  nutrients: {
    "7": 50   // Vitamin C: BEFORE (unitsPer100g: 50)
  }
  nutrientTableCode: "0400"
}

↓ After recalculation ↓

SurveySubmissionFood {
  code: "ORANGE"  ← SAME
  nutrients: {
    "7": 59   // Vitamin C: UPDATED (unitsPer100g: 59)
  }
  nutrientTableCode: "0400"  ← SAME (historical reference preserved)
}
```

---

#### Example 2: New Nutrient Field Added

**Problem:** NDNS released new data with "Omega-3 fatty acids" for all foods. Existing submissions need this new nutrient field added.

**Survey context:**

- 5,000 salmon submissions
- Nutrient mapper already added Omega-3 to food records
- Need to populate new field in existing submissions

**Solution:**

```json
{
  "surveyId": "59",
  "mode": "values-only",
  "syncFields": true
}
```

**Result:**

- ✅ Nutrient values in `nutrients` object recalculated
- ✅ New Omega-3 field added to `fields` object
- ✅ `nutrientTableCode` and `nutrientTableId` preserved
- ✅ Food references (`code`, names) unchanged

**Before/After:**

```
SurveySubmissionFood {
  code: "SALMON"
  nutrients: {
    "1": 208, "3": 20, "6": 13  // Values
  },
  fields: {
    "energy_100": "208",
    "protein_100": "20",
    "fat_100": "13"
  },
  nutrientTableCode: "0500"  (SAME)
}

↓ After recalculation ↓

SurveySubmissionFood {
  code: "SALMON"  ← SAME
  nutrients: {
    "1": 208, "3": 20, "6": 13,  // RECALCULATED
    "50": 2.3  // ADDED: Omega-3
  },
  fields: {
    "energy_100": "208",
    "protein_100": "20",
    "fat_100": "13",
    "omega_3_100": "2.3"  // NEW FIELD
  },
  nutrientTableCode: "0500"  ← SAME
}
```

---

#### Example 3: Food Remapped to Better Nutrient Record

**Problem:** Apple was originally mapped to generic "Apple" record (0100). NDNS has been updated with more accurate "Apple, Granny Smith" (0102) which is a better match.

**Survey context:**

- 10,000 apple submissions
- Foods database already updated with new mapping
- OK to change historical record reference
- OK to update field structure

**Solution:**

```json
{
  "surveyId": "59",
  "mode": "values-and-codes",
  "syncFields": true
}
```

**Result:**

- ✅ `nutrientTableCode` updated to "0102" ("Apple, Granny Smith")
- ✅ Nutrient values updated with more accurate data
- ✅ New fields from 0102 added to `fields` object
- ⚠️ Historical food-to-nutrient mapping changed (`nutrientTableCode`)
- ✅ Food `code` unchanged (still APPLE)

**Before/After:**

```
SurveySubmissionFood {
  code: "APPLE"
  nutrients: {
    "1": 52,    // Energy
    "7": 4.6    // Vitamin C
  },
  nutrientTableCode: "0100"  // Generic Apple
  fields: {
    "sub_group_code": "58A"
  }
}

↓ After recalculation ↓

SurveySubmissionFood {
  code: "APPLE"  ← SAME
  nutrients: {
    "1": 51,        // UPDATED: from generic (0100) → Granny Smith (0102)
    "7": 5.7,       // UPDATED: from generic → Granny Smith
    "30": 1.8       // ADDED: Malic acid (new in 0102)
  },
  nutrientTableCode: "0102"  (UPDATED: GenericApple → Granny Smith)
  fields: {
    "sub_group_code": "51R"  // UPDATED: based on new nutrient record
  }
}
// ⚠️ nutrientTableCode changed: "0100" → "0102"
```

---

#### Example 4: Complete Food Database Update

**Problem:** Nutrient mappings have been revised and nutrient tables restructured. Multiple fields were removed/added. Need complete nutrient synchronization.

**Survey context:**

- 30,000+ submissions across multiple foods
- Food database completely refreshed
- Multiple field changes
- Need everything current

**Solution:**

```json
{
  "surveyId": "59",
  "mode": "values-and-codes",
  "syncFields": true
}
```

**Result:**

- ✅ `code`, `englishName`, and `localName` remain unchanged
- ✅ `nutrientTableCode` and `nutrientTableId` remapped
- ✅ `fields` object completely synced
- ✅ All values in `nutrients` object recalculated
- ⚠️ Nutrient references and nutrient/field data changed significantly

**Before/After:**

```
SurveySubmissionFood {
  code: "CHICK1"
  englishName: "Chicken, raw"
  nutrientTableCode: "0500"
  nutrients: {
    "1": 165,  // Energy
    "3": 31    // Protein
  },
  fields: {
    "sub_group_code": "51R"
  }
}

↓ After recalculation ↓

SurveySubmissionFood {
  code: "CHICK1"  ← SAME
  englishName: "Chicken, raw"  ← SAME
  nutrientTableCode: "0515"  (UPDATED)
  nutrients: {
    "1": 166,   // UPDATED
    "3": 33,    // UPDATED
    "6": 3.6,   // ADDED: Fat
    "44": 27    // ADDED: Selenium
  },
  fields: {
    "sub_group_code": "58A"  // UPDATED: based on new nutrient record
  }
}
// ⚠️ Nutrient references updated - SIGNIFICANT CHANGE
```

---

#### Example 5: Dry-Run / Testing Configuration

**Problem:** Want to test the job setup and parameter validation before running on live data.

**Solution:**

```json
{
  "surveyId": "59",
  "mode": "none",
  "syncFields": false
}
```

**Result:**

- ✅ Job runs successfully
- ✅ Validates survey ID exists
- ✅ Emits statistics about submissions to process
- ❌ Makes NO changes to submissions
- ✅ Safe to run on production without risk

**SQL-level changes:** None - job completes without modifying any `SurveySubmissionFood` records.

**Output example:**

```
Started recalculation for survey 59 (mode: none)
Processed: 2405 submissions
Updated: 0, Skipped: 2405
Result: No changes (mode=none)
```

### Job Output

On completion, the job stores a summary message with statistics:

- Total submissions processed
- Submissions updated vs skipped
- Nutrient table codes updated
- Nutrient values recalculated
- Fields added/removed from `fields` object
- Errors encountered

The job updates `SurveySubmissionFood` records and their nested:

- `nutrients` JSONB object (nutrient values)
- `fields` JSONB object (field values)
- `nutrientTableCode` and `nutrientTableId` properties

Example output:

```
Recalculation completed. Total: 5432, Updated: 5401, Skipped: 31,
Nutrient codes updated: 127, Fields added: 543, Fields removed: 0,
Errors: 31
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
