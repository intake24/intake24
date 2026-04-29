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

## LocaleFoodRankingUpload

`LocaleFoodRankingUpload` uploads food ranking data for selected locale.

```json
{
  "localeId": string,
  "file": File
}
```
