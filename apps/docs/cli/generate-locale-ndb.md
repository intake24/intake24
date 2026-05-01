# Generate Locale NDB Data

Exports food–nutrient associations for a locale to a CSV file. The output can be used with two admin import tasks depending on how the command is run.

```sh
pnpm cli gen-locale-ndb-data
```

The command prompts for:

- **Locale ID** — the locale to export (e.g. `UK_current`)
- **NDB table ID** — the nutrient table to filter by (e.g. `UK_NDB_3`); leave blank to export all tables
- **Output file path** — defaults to `<locale>-<table>-data.csv`

Each exported row contains:

| Column           | Content                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| FCT record ID    | Food Composition Table (FCT) record ID / Nutrient table record ID       |
| FCT              | Food Composition Table (FCT) Nutrient table ID                          |
| Food ID          | Unique food identifier                                                  |
| Locale           | Locale ID (e.g. `UK_current`)                                           |
| Food code        | Food code (e.g. `BRDS`, `197UPFRL`)                                     |
| English name     | Food English name (e.g. `Apple`)                                        |
| Local name       | Food local name                                                         |
| Sub-group code   | Sub-group code(s), comma-separated if there are multiple of them        |
| Alternative Name | Alternative names from all locales, sorted and comma-separated          |
| Tags             | Food tags, sorted and comma-separated                                   |
| Columns 10+      | Nutrient values per 100g of food, as referenced in the nutrient mapping |

## With a specific NDB table

When a nutrient table ID is provided, nutrient columns are placed at the exact column offsets defined in `nutrient_table_csv_mapping`. This preserves the spreadsheet column alignment required by the importer.

```
✔ Output is compatible with Admin → Nutrient Tables → Import NDB data
```

The nutrient column layout is derived from the table's CSV mapping configuration. Run **Nutrient table - Import NDB mapping** first if the mapping has not been configured.

## Without a NDB table (export all)

When the table ID is left blank, all FCT records linked to foods in the locale are exported — including records from multiple nutrient tables.

:::warning
Nutrient columns are ordered by nutrient type ID, not by spreadsheet column offset. This output is **not** compatible with **Nutrient table - Import NDB data**.

Use this mode for cross-table analysis or as input for **Admin → Locale → Import food-nutrient mapping** only.
:::
