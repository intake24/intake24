# Localising a food database

This guide is for researchers and administrators adapting an existing Intake24 food database to a new country or population. You start from a copy of an existing locale, for example `United Kingdom (current)`, and edit food names and alternative names in Excel. You then load the edits back into Intake24.

A **locale** is one country or population's version of the food database: its foods, categories, portion sizes, and search settings.

## Overview

1. [Create the new locale](#_1-create-the-new-locale)
2. [Copy data from an existing locale](#_2-copy-data-from-an-existing-locale)
3. [Export the new locale to Excel](#_3-export-the-new-locale-to-excel)
4. [Edit the spreadsheets](#_4-edit-the-spreadsheets)
5. [Import the edited spreadsheets](#_5-import-the-edited-spreadsheets)
6. [Check search](#_6-check-search)

Steps 3 to 6 can be repeated as often as needed.

:::warning Always start a round from a fresh export
Importing an older spreadsheet overwrites any changes made in the admin interface since that export was taken.
:::

## 1. Create the new locale

In the [Locales](/admin/locales/) section, select `Add locale`, complete all fields, and make sure `Food index enabled` is on. Save.

## 2. Copy data from an existing locale

Copy gives the new locale a full set of foods, categories and settings to edit, instead of starting empty.

1. Open the new locale's `Tasks` tab and select `Locale - Copy data`.
2. Set `Source Locale ID` to the locale to copy, for example `United Kingdom (current)`.
3. Leave all subtasks ticked unless you know you want to leave something out.
4. Submit.

:::danger Data loss warning
Copying deletes all existing data in the new locale for each ticked subtask before copying. Only run it on a new locale, or one you are happy to reset.
:::

## 3. Export the new locale to Excel

Go to `Import/export`, then `Export package`.

1. Select the new locale under `Locales to include`.
2. Choose `MS Excel (XLSX)` as the export format.
3. Tick `Include "Action" column` so each food gets an `Action` dropdown.
4. Under `Data to include`, tick `Food list`, `Category list` and `Synonym sets`.
5. Select `Request export` and download the file when it is ready.

The download is a ZIP archive of Excel workbooks. Unzip it and keep a pristine copy before editing.

## 4. Edit the spreadsheets

The rules below keep the file importable.

**Do**

- Set `Action` for every food: `Retain` (keep as is), `Amend` (keep with changes), `Add` (new food) or `Delete` (do not import this food). `Delete` only leaves the row out of the import. It does not remove a food that is already in the locale, so a food copied in step 2 stays searchable unless you also delete it in the locale's food database in the admin interface.
- Fill in `Action` on every food row. A missing or invalid `Action` is reported as an error and the import is rejected.
- Add new foods and categories in new rows at the bottom of their lists.
- Give every new food a unique `Code` (by convention up to 8 letters and numbers, as in existing locales; the system accepts up to 64 characters), a `Name` and an `English Name`. A row missing either name is reported as an error, and the import is rejected until you fix it.
- Add extra names for the same food in the `Alt. names` sheet. See [Search and alternative names](/admin/locales/search-and-alt-names#alternative-names).
- Add columns for your own notes at the far right of a sheet.
- Leave optional sheets and columns as exported unless your study needs them, for example `Thumbnail Path`, `Brands`, `Tags` and `Attributes`.
- In Yes/No cells, use `Yes`, `No`, `Y`, `N`, `TRUE` or `FALSE`. A blank cell means the value is inherited from the food's category.

**Do not**

- Rename the workbook files. `package.json` refers to them by name.
- Delete rows from `Foods master list`, or delete, rename or reorder columns in any sheet. Mark a food `Delete` instead. The exception is the `Alt. names` sheet: importing replaces all of a food's alternative names with the rows listed, so delete a row there to remove that name.
- Change the `Code` of a food you keep. Other sheets refer to it, and they are not updated automatically.
- Change a food into a completely different food. Mark the old one `Delete` and add a new one.

Fill in `Name` for every food. Foods without a `Name` cannot be found by search.

### Missing information

Some details can be left blank and filled in a later round. Others make the import fail:

| Left blank                         | What happens on import                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Name`, `English Name` or `Action` | Validation error. The import is rejected until you fill it in                                    |
| `Parent Categories`                | The food is imported without a category, so it inherits no settings, such as portion sizes       |
| Portion size rows                  | The food's own portion size methods are removed. It falls back to its category's methods, if any |
| Attributes                         | Inherited from the food's category                                                               |

:::warning Portion sizes
Each food you keep or add replaces the stored version of that food, including its portion sizes. If a respondent selects a food with no portion size methods of its own or from a category, the survey cannot continue past the portion size question.
:::

## 5. Import the edited spreadsheets

1. Zip the edited workbooks back into one ZIP archive, with the same file names as the export, including `package.json`. Select the files inside the unzipped folder and compress those. If you compress the folder itself, `package.json` ends up one level down and the import fails.
2. Go to `Import/export`, then `Import package`, and choose package format `Intake24`.
3. Select the ZIP archive and choose `Upload and validate`. Intake24 checks it first and lists any problems. Fix them in the spreadsheet and upload again.
4. Check the target locale. After validation the import screen shows "This package targets …", taken from `package.json`. Make sure it names your locale. Importing into the wrong locale overwrites its data.
5. Choose what to import. Tick only what you exported and edited, usually `Food list` and `Category list`, plus `Synonym sets` if you changed them. Set `If already exists` to `Overwrite` for each:
   - **Food list / Category list:** each food or category in the file replaces the stored one with the same code. Foods and categories not in the file, including rows marked `Delete`, are left unchanged.
   - **Synonym sets:** **all** of the locale's synonym sets are deleted and replaced with the ones in the file. Untick `Synonym sets` if you did not change them.
   - `Skip` keeps the stored version when a code already exists. `Abort` stops the whole import if any code already exists.
6. Select `Start import`.

:::warning Rebuild the search index
Searching uses a prepared index of food names. Unless your administrator has enabled automatic rebuilds, imported names do not appear in search until the `Locale - Rebuild Food Indexes for modified locales` job is submitted. It is a system-level job, not one of the locale `Tasks`, and you may need an administrator to run it. Leave `Force rebuild for all locales` off.
:::

## 6. Check search

Open a survey that uses the new locale and search for the new and changed foods, including their alternative names and spelling variants. If a food is hard to find, go back to step 4 and add alternative names or fix its `Name`. See [Search and alternative names](/admin/locales/search-and-alt-names).

Split words are not part of the Excel export. Edit them in the locale's `Split words` tab.

## Terms

| Term             | Meaning                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Locale           | One country's or population's version of the food database                                      |
| Food code        | The unique identifier of a food. Portion sizes, nutrients and associated foods are linked to it |
| Package          | A ZIP archive used to export and import food database data                                      |
| Alternative name | An extra name for the same food, searched like the main name                                    |
| Search index     | The prepared list of food names that search looks in. It is rebuilt after changes               |
