# Tasks

Tasks section allows to submit resource specific tasks into the job queue with additional parameters.

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

## LocaleFoodNutrientAssociation

`LocaleFoodNutrientAssociation` associates locale foods with nutrient table records.

Associate mode reads a CSV with these headers:

```csv
Locale,Food code,FCT (NDB name),FCT record ID (NDB Food Code)
```

Each row must name the selected locale. Missing foods, nutrient tables, or nutrient table record IDs are reported in the downloadable audit CSV while valid rows continue. Existing associations are skipped. Dry-run performs the same validation without changing data.

Replace mode needs a source and target nutrient table. For each source association in the selected locale, it replaces the source record with the same record ID in the target table. If the target has no matching record, the source association remains unchanged and the audit CSV reports the failure.

## LocaleFoodRankingUpload

`LocaleFoodRankingUpload` uploads food ranking data for selected locale.

```json
{
  "localeId": string,
  "file": File
}
```
