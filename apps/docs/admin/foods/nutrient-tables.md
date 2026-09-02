# Nutrient tables

Nutrient table is used to define nutrient composition of foods.

## Tasks

Tasks section allows to submit resource specific tasks into the job queue with additional parameters.

Jobs that can be submitted:

### NutrientTableDataImport

`NutrientTableDataImport` imports data from CSV file containing nutrient data.

```json
{
  "nutrientTableId": string,
  "file": File
}
```

### NutrientTableDataExport

`NutrientTableDataExport` exports nutrient table data as a downloadable CSV file that can be imported by `NutrientTableDataImport`.

```json
{
  "nutrientTableId": string
}
```

The export places values at the configured CSV mapping column indexes. If the mapping has a positive row offset, it writes the CSV header in the first skipped row and leaves the remaining skipped rows empty; otherwise it exports headerless data so the file remains importable. Header names are `NDB food ID (FCT record ID)`, `NDB food description`, `NDB local food description`, configured field names, and nutrient type descriptions. The first value is the nutrient table record ID used as the locale-food nutrient mapping reference.

### NutrientTableMappingImport

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

### NutrientTableMappingExport

`NutrientTableMappingExport` exports the configured nutrient mapping as a downloadable CSV file.

```json
{
  "nutrientTableId": string
}
```

| Column                       | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| Intake24 nutrient ID         | [Intake24 nutrient type ID](/admin/foods/nutrient-types)   |
| NDB spreadsheet column index | Excel-based column name                                    |
| Nutrient name                | Informational nutrient type description; ignored on import |
