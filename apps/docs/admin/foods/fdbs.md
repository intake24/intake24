# Food databases

`Food databases` or `food lists` are list of food records attached to locale record.

Foods are organized in categories and subcategories in tree-like structure.

Food database editor offers tree-like structure browsing of `category` / `food` records.

::: warning

Food database editor allows browsing and editing of food database records.

Food database editor does not yet include category or food `creation` / `deletion` / `cloning`.

:::

Most of the properties are similar between `category` and `food` records with few specific exceptions.

## Global properties

Global system-wide food properties shared by all locales. Locale-specific food properties are stored children of the global food record.

### Code

System-wide unique code, uppercase alphanumeric string, 1-8 characters long (by convention).

### Name

Descriptive name for admin purposes (in English by convention).

### Hidden (`category-only`)

Option to set category record as hidden. Will be excluded from global food search.

## Local food properties

Locale specific child records of the global food record.

### Food name

Locale specific food name.

### Attributes

Attributes are inhered from default attribute values and can either set as inherited or overridden.

- `same as before` - flag whether the food should be used for `same-as-before` prompt functionality

- `ready-made food` - flag whether the food is should be used for `ready-made` prompt functionality

- `reasonable amount` - food portion size amount (g) to be considered as `reasonable`

- `use for recipes`

### Categories

List of categories the food is attached to.

## Nutrient table records

List nutrient table records attached to food record.

Composite link of `nutrient table ID` and `nutrient table record ID`.

## Portion size methods

List of portion size methods attached to food record.

## Associated foods

List of associated foods attached to food record.

- `association` - food can either be associated with `food` or `category` record

- `link as main` - to be implemented

- `allow multiple foods` - to be implemented

- `generic name` - localized generic name of the food

- `text` - localized question to be asked
