# Search and alternative names

This page explains how respondents' typed words find foods in a locale, and how to make foods easier to find using alternative names, split words and synonym sets.

:::tip Stemming
Search reduces words to a common root ("stem") so that `sausages` finds `sausage`. You never need to type stems yourself. Always enter ordinary words.
:::

## How search finds a food

When a respondent types a food description, Intake24:

1. Converts it to lower case and replaces punctuation such as `. , / \ - + ( )` with spaces.
2. Ignores single-letter words and, for English, the words `and`, `the`, `with` and `from`.
3. Reduces each remaining word to its stem.
4. Looks for foods whose name or alternative names contain matching words, allowing for small spelling mistakes, similar-sounding words and [synonym sets](#synonym-sets).

Foods rank higher when more words match, in the same order and close together. Words that match nothing push a food down the list.

:::warning Fill in `Name` for every food
Only a food's `Name` (called `Local name` in the admin interface and in the `LocaleFoods` export) and its alternative names are searched. A food with an empty `Name` does not appear in search results, even if it has an `English name`.
:::

## Alternative names

An alternative name is an extra name for the same food. It is searched exactly like the main `Name`. Search results show the name that matched, so a respondent who typed an alternative name sees that name, and selecting it selects the same food.

Use alternative names for:

| Situation                              | Example                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------- |
| A second local or English name         | `Egg curry` with alternative names `Anda curry` and `Biththara vyanjanaya` |
| A short name for a long description    | `Cheeseburger, in a bun, homemade` with `homemade burger`                  |
| A specific variety of the same food    | `Apple, raw` with `granny smith` or `gala`                                 |
| A word written with or without a space | `Milkshake` with `milk shake`; `Fishcake` with `fish cake`                 |

Do not create a separate food just to carry another name. It lengthens the food list and each extra food needs its own portion size and nutrient details.

:::warning Language
Alternative names are stored per language, and only the names in the same language as the locale's search language (the locale's `Food index language backend`, usually `en`) are searched. Names stored under any other language are kept but not found by search. This applies to local-language names too: for a locale searched in English, enter them under `en`.

For example, in a locale searched in English with Chichewa food names, enter each Chichewa name as an alternative name with language `en`, even though the name is not English. Search then finds the food by either name.

In Excel, an `Alt. names` row whose `Code` does not match a food in `Foods master list` is ignored without an error, so check codes carefully.
:::

## Split words

Split words are not part of the search index. They tell Intake24 where to break a respondent's typed meal description into separate foods. For example, if `and` is a split word, `burger and chips` is offered as two foods, `burger` and `chips`.

Each entry is a space-delimited list of words or characters. A plain entry matches anywhere in the text, so `and` would also split `sandwich` into `s` and `wich`. Surround words with `!_!` (a space) to match whole words only, for example `!_!and!_! !_!with!_! &`. Two special forms are available:

| Form            | Meaning                                                                                     | Example                                                |
| --------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `!_!`           | A space                                                                                     | `!_!with!_!` splits on `with` but not inside `without` |
| `!word1:word2!` | If the description splits into exactly these two parts, split without asking the respondent | `!burger:chips!`                                       |

Forced pairs accept single words only, in either order.

## Synonym sets

A synonym set is a list of words that search treats as the same. Entries are space-delimited, for example `chips fries`. A respondent typing either word finds foods containing the other.

Synonym sets apply to the whole locale. Prefer alternative names when only one food needs the extra name.

## Search language

Stemming and stop words depend on the locale's `Food index language backend`. Backends are available for English (`en`), French (`fr`), Portuguese (`pt-PT`) and Arabic (`ar-AE`). For other languages, choose the closest backend and make foods easier to find with alternative names, for example spelling variants and compound-word forms such as both `appeltaart` and `appel taart`.

## Editing workflows

### Admin interface

- **Alternative names:** open the food in the locale's food database and edit `Alternative names` for the relevant language. See [Food databases](/admin/locales/fdbs#alternative-names-foods-only).
- **Split words and synonym sets:** open the locale and use the `Split words` and `Synonym sets` tabs. See [Locales](/admin/locales/).

### Excel

Alternative names are in the `Alt. names` sheet of the food database workbook, one row per name:

| Column             | Content                                       |
| ------------------ | --------------------------------------------- |
| `Code`             | Food code (must exist in `Foods master list`) |
| `Language`         | Language id, e.g. `en`                        |
| `Alternative Name` | The extra name                                |

Synonym sets are in a separate workbook, `synonym-sets.xlsx`, sheet `Synonym sets`, with columns `Locale` and `Synonyms` (words separated by spaces).

Split words are not included in the Excel package. Edit them in the admin interface.

### JSON

In `foods.json`, `alternativeNames` is keyed by language id, each value a list of names. See [Food database package format](/admin/locales/package-format). Synonym sets are in `synonym-sets.json`, keyed by locale id, each set a list of words.

## Alternative names in exports

The `LocaleFoods` task exports a locale's foods to CSV, with alternative names in the `Alternative names` column. See [Tasks](/admin/locales/tasks#localefoods).

Survey submission exports do not include alternative names. They record the food's main name (`Name (local)` and `Name (en)`) and the words the respondent typed (`Search term`).
