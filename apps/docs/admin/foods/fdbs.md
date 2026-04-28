---
{ "outline": { "level": [2, 4] } }
---

# Food databases

`Food databases` or `food lists` are list of food records attached to locale record.

Foods are organized in categories and subcategories in tree-like structure.

Food database editor offers tree-like structure browsing of `category` / `food` records.

Most of the properties are similar between `category` and `food` records with few specific exceptions.

## Properties

### Code

Locale-unique code for the category or food record. Used for linking records across locales.

### English name

English name of the category or food record. Used for internal purposes and as fallback when locale specific name is not available.

### Local name

Localized name of the category or food record.

### Icon

Icon for the category or food record.

:::tip

Intake24 is using [iconify](https://icon-sets.iconify.design/) icons. Any icon from the iconify collection can be used as food icon. However not all icons are being bundled with Intake24, so if you want to use an icon that is not bundled, the technical team will need to be contacted to add the icon to the bundle.

:::

### Hidden (`category-only`)

Option to set category record as hidden. Will be excluded from global food search.

### Tags

List of tags attached to category or food record. Can be used for various purposes, e.g. setting up conditional logic in prompts.

### Alternative names (`foods-only`)

List of alternative names for the food record. Used for foods which are known under different names in different regions or by different groups of people.

## Categories

List of parent categories the category or food is attached to.

## Attributes

Attributes are inhered from default attribute values and can either set as inherited or overridden.

- `inherited` - when set to inherited, attribute value is inherited from parent category. Algorithm goes through the parent categories until it finds a record with overridden value for the attribute.
- `overridden` - when set to overridden, attribute value is set specifically for the category or food record and is not inherited from parent category.

**Attributes list:**

- `same as before` - flag whether the food should be used for `same-as-before` prompt functionality

- `ready-made food` - flag whether the food is should be used for `ready-made` prompt functionality

- `reasonable amount` - food portion size amount (g) to be considered as `reasonable`

- `use for recipes`

## Nutrient table records (foods-only)

List nutrient table records attached to food record.

## Portion size methods

List of portion size methods attached to food record. See [portion size methods documentation](/admin/foods/portion-sizes) for more details on portion size methods.

## Associated foods (foods-only)

List of associated foods attached to food record.

- `association` - food can either be associated with `food` or `category` record

- `link as main` - flag whether the associated food should be linked as main food

- `allow multiple foods` - flag whether multiple associated foods can be selected in the same prompt

- `generic name` - localized generic name of the food

- `text` - localized question to be asked
