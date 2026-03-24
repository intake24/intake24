## SurveyNutrientsRecalculation job details

### Database Fields Updated

**Core submission data objects and properties affected** (depends on mode):

| Model → Property                         | Type         | Updated in Modes                                                                                                                |
| ---------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `SurveySubmissionFood.nutrients`         | JSONB object | → All modes except `none` (values of existing keys only when `syncFields: false`; full replacement when `syncFields: true`)     |
| `SurveySubmissionFood.nutrientTableCode` | String       | → `values-and-codes`, `values-and-codes+syncFields`                                                                             |
| `SurveySubmissionFood.nutrientTableId`   | String       | → `values-and-codes`, `values-and-codes+syncFields`                                                                             |
| `SurveySubmissionFood.fields`            | JSONB object | → All modes except `none` (values of existing keys only when `syncFields: false`; full structural sync when `syncFields: true`) |

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
2. Recalculate values of **existing** nutrients in the `nutrients` JSONB object using current `unitsPer100g`
3. Recalculate values of **existing** fields in the `fields` JSONB object

**`syncFields: false` (default):**

- Only updates values of nutrients/fields already present in the submission
- Does **not** add new nutrients or fields even if the source record now has them
- Nutrients in the submission that no longer exist in the source record are **zeroed out** (value set to `0`, key preserved)
- Fields in the submission that no longer exist in the source record are left unchanged

**`syncFields: true`:**

- Full sync of nutrients and fields
- New nutrients/fields from the source record are **added** to the submission
- Nutrients/fields no longer in the source record are **removed** from the submission
- All values are recalculated from the source record

**What remains unchanged (both syncFields settings):**

- Food code (`code`) and names (`englishName`, `localName`)
- Nutrient table references (`nutrientTableId`, `nutrientTableCode`)

**Use when:**

- Nutrient composition values have been corrected (e.g., Vitamin C updated from 50mg to 52mg)
- Same nutrient records still apply to foods
- You want to preserve historical food-to-nutrient mappings

**Example:**

```json
{
  "surveyId": "59",
  "mode": "values-only",
  "syncFields": false
}
```

---

#### `values-and-codes`

**Updates nutrient amounts using current food-to-nutrient mappings.** Changes the historical reference to use the current nutrient composition data.

**What is recalculated:**

For each `SurveySubmissionFood`:

1. Look up the food by its `code` in the current foods database
2. Use the **current** nutrient table mapping for that food
3. Update `nutrientTableCode` and `nutrientTableId` to match current mapping
4. Recalculate nutrient values using the current nutrient record's `unitsPer100g`
5. Recalculate field values from the current nutrient record

**`syncFields: false` (default):**

- Updates `nutrientTableCode` and `nutrientTableId` to current mapping
- Only updates values of nutrients/fields already present in the submission
- Does **not** add new nutrients or fields even if the new nutrient record has them
- Nutrients in the submission that don't exist in the new nutrient record are **zeroed out** (value set to `0`, key preserved)
- Fields in the submission that don't exist in the new nutrient record are left unchanged

**`syncFields: true`:**

- Updates `nutrientTableCode` and `nutrientTableId` to current mapping
- Full structural sync of nutrients and fields
- New nutrients/fields from the current nutrient record are **added** to the submission
- Nutrients/fields no longer in the current nutrient record are **removed** from the submission
- All values are recalculated from the current nutrient record

**What remains unchanged (both syncFields settings):**

- Food code (`code`) and names (`englishName`, `localName`)

**Use when:**

- Foods have been remapped to different or more accurate nutrient records
- Nutrient table structure has changed significantly
- You want submissions to reflect the current state of the food database
- You understand this changes the historical mapping reference

**Example:**

```json
{
  "surveyId": "59",
  "mode": "values-and-codes",
  "syncFields": true
}
```

**⚠️ Important:** This mode changes data provenance. The submission will no longer reference the nutrient composition that was active when the survey was submitted. Use with caution and keep backups.

---

#### Edge Cases Handled

The job processes these situations gracefully:

| Situation                                                               | Behavior                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Food code not found in foods DB**                                     | No replacement inference (`X` is not replaced by `Y`)                                |
| **Food not found in database (mapping-required modes)**                 | Skipped with warning, original data retained                                         |
| **Food not found in database (`values-only` with `syncFields: false`)** | Recalculation can still proceed using stored `nutrientTableId` / `nutrientTableCode` |
| **Nutrient record deleted or dissociated**                              | ⚠️ **Clears nutrients and fields**; logs warning; continues processing               |
| **Nutrient in submission not in source record (`syncFields: false`)**   | Value set to `0` (nutrient key preserved, marked unresolvable)                       |
| **Nutrient in source record not in submission (`syncFields: false`)**   | Not added to submission (structure preserved)                                        |
| **Nutrient in source record not in submission (`syncFields: true`)**    | Added to submission with recalculated value                                          |
| **Food has no current nutrient mappings**                               | Skipped with warning                                                                 |
| **Multiple nutrient mappings for food**                                 | Uses first mapping (consistent with submission)                                      |
| **Field definition changed type**                                       | Removed in sync operation                                                            |
| **Nutrient value is zero**                                              | Kept as zero (valid value)                                                           |

**Important: Deleted Nutrient Records**

When a nutrient record is completely deleted or dissociated from a food, the job will clear the `nutrients` and `fields` objects for those submission foods.

When individual nutrient variables are dropped from a record (but the record still exists), the behavior depends on `syncFields`:

- **`syncFields: false`**: The nutrient key is preserved in the submission but its value is set to `0` (zeroed out). This preserves the submission structure while indicating the value is unresolvable.
- **`syncFields: true`**: The nutrient key is fully removed from the submission, and any new nutrients in the source record are added.

#### Performance Considerations

- Processes foods in batches of 100
- Progress tracking updates incrementally
- Job completion message includes statistics
- Large surveys (10,000+ submissions) may take several minutes

### Mode Combination Summary Table

**Quick reference for all valid combinations:**

| Scenario                 | Mode               | syncFields | Preserves Mapping | Updates Fields | Scope                                       |
| ------------------------ | ------------------ | ---------- | ----------------- | -------------- | ------------------------------------------- |
| **Testing**              | `none`             | N/A        | ✓ Yes             | — No           | None                                        |
| **Value corrections**    | `values-only`      | `false`    | ✓ Yes             | → Values only  | Existing nutrients/fields only              |
| **Values + full sync**   | `values-only`      | `true`     | ✓ Yes             | → Full sync    | All nutrients + fields (add/remove/update)  |
| **Remapped foods**       | `values-and-codes` | `false`    | → Changed         | → Values only  | Codes + existing nutrients/fields only      |
| **Remapped + full sync** | `values-and-codes` | `true`     | → Changed         | → Full sync    | Codes + all nutrients + fields (add/remove) |

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
 {
    "sub_group_code": "62R"
  },"13"
  },
  nutrientTableCode: "0500"  (SAME)
}

↓ After recalculation ↓

SurveySubmissionFood {
  code: "SALMON"  ← SAME
  nutrients: {
    "1": 208, "3": 20, "6": 13,  // RECALCULATED
    "50": 2.3  // ADDED: Omeg  3
  },
  f    "sub_group_code": "62R" // RECALCULATED based on new nutrient record (if changed)NEW FIELD
  },
  nutrientTableCode: "0500"  ← SAME
}
```

---

#### Example 3: Food Remapped to Better Nutrient Record

**Problem:** Apple was originally mapped to generic "Apple" record (0100). NDNS has been updated with more accurate "Apple, Granny Smith" (0102). You want to update submissions to use the more accurate mapping and values, but you don't want to add new nutrients/fields that the new record might have—keep the existing structure.

**Survey context:**

- 10,000 apple submissions
- Foods database already updated with new mapping
- Need more accurate nutrient values
- Want to update mapping codes to reflect current data
- Don't want to add new nutrients/fields (structure should remain unchanged)

**Solution:**

Use `values-and-codes` mode without `syncFields` to remap and update existing nutrients/fields only.

```json
{
  "surveyId": "59",
  "mode": "values-and-codes",
  "syncFields": false
}
```

**Result:**

- ✅ `nutrientTableCode` updated to "0102" ("Apple, Granny Smith")
- ✅ Nutrient values updated using new record's composition
- ✅ Nutrient values recalculated for **existing** nutrients only
- ✅ Field values recalculated for **existing** fields only
- — New nutrients/fields from 0102 NOT added (structure preserved)
- ⚠️ Nutrients in submission that don't exist in new record are zeroed out
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
    "1": 51,        // UPDATED: Energy from new record (0102)
    "7": 5.7        // UPDATED: Vitamin C from new record (0102)
  },
  nutrientTableCode: "0102"  (UPDATED: GenericApple → Granny Smith)
  fields: {
    "sub_group_code": "51R"  // UPDATED: based on new nutrient record
  }
}
// ⚠️ nutrientTableCode changed: "0100" → "0102"
// NOTE: Nutrient "30" (Malic acid) from 0102 is NOT added because syncFields=false
// NOTE: If submission had nutrients that don't exist in 0102, they would be zeroed
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

Use `values-and-codes` mode with `syncFields` to completely synchronize all fields and nutrients according to new nutrient code mappings.

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

- ✓ Job runs successfully
- ✓ Validates survey ID exists
- ✓ Emits statistics about submissions to process
- ✓ Makes NO changes to submissions (safe, as intended)
- ✓ Safe to run on production without risk

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
