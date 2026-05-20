---
{ "outline": { "level": [2, 3] } }
---

# Food database package format (v2)

The food database package format is a JSON-based zip archive used for both import and export of Intake24 food database data. It can contain locales, foods, categories, portion size support records, and the image files referenced by those portion size records.

Typical uses include:

- importing data from external sources or other food database formats after converting them into the Intake24 package structure;
- moving food database data between development, staging, and production Intake24 instances;
- exporting a locale food database as a backup before large edits or migration work;
- sharing a food database with another Intake24 deployment or research team;
- reviewing or transforming food database data outside Intake24 using standard JSON tooling.

## Archive layout

```
package.json                  ← format metadata
locales.json                  ← locale definitions
foods.json                    ← foods, grouped by locale
categories.json               ← categories, grouped by locale
portion-size/                 ← portion size estimation methods
  as-served.json
  guide-images.json
  drinkware-sets.json
  image-maps.json
images/                       ← source image files (optional)
```

`package.json`:

```json
{ "version": "2.0", "format": "json" }
```

`version` identifies the package format version; the current version is `2.0` but may change in future releases. `format` is `json` or `xlsx`; this page covers `json` only.

Portion-size files only contain records actually referenced by the exported foods and categories — they are not a full dump of the database. `images/` is present only when image files were included in the export, and preserves the stored relative paths of the source images.

## Shared types

Locale translations are objects keyed by language ID:

```json
{ "en": "Milk", "cy": "Llaeth" }
```

Localised option lists are keyed by language ID. `en` is required; other languages are optional. Each entry has a display `label` and a typed `value`:

```json
{
  "en": [
    { "label": "A little (a quarter)", "value": 0.25 },
    { "label": "A medium amount (a half)", "value": 0.5 },
    { "label": "A lot (three quarters)", "value": 0.75 }
  ],
  "fr": [
    { "label": "Un peu (un quart)", "value": 0.25 },
    { "label": "Une quantité moyenne (la moitié)", "value": 0.5 },
    { "label": "Beaucoup (trois quarts)", "value": 0.75 }
  ]
}
```

Each option can also carry `id`, `shortLabel`, `exclusive`, and `selected` fields, all optional.

Category-specific localised option lists have a `_default` and optional per-category overrides keyed by category code:

```json
{
  "_default": {
    "en": [
      { "label": "Small", "value": 0.25 },
      { "label": "Medium", "value": 0.5 }
    ]
  },
  "BREAKFAST_CEREALS": {
    "en": [
      { "label": "One bowl", "value": 1.0 },
      { "label": "Two bowls", "value": 2.0 }
    ]
  }
}
```

Inheritable attributes are resolved by walking up the category tree when a field is absent:

```ts
type InheritableAttributes = {
  readyMealOption?: boolean
  sameAsBeforeOption?: boolean
  reasonableAmount?: number
  useInRecipes?: 0 | 1 | 2
}
```

Field notes:

- `readyMealOption` controls whether the ready-meal prompt is shown for this food or category.
- `sameAsBeforeOption` controls whether the "same as before" shortcut is available.
- `reasonableAmount` is a gram threshold above which Intake24 treats the entered amount as implausibly large.
- `useInRecipes` controls where the food may appear: `0` = both standalone and recipe ingredient (no restriction), `1` standalone only, `2` recipe ingredient only.

## locales.json {#format-locales}

`locales.json` lists the locales included in the package. A locale represents a regional or study-specific food database variant — it combines language settings with a food list and category tree.

The file is a flat array of locale records. Each item contains:

```ts
{
  id: string
  englishName: string
  localName: string
  respondentLanguage: string
  adminLanguage: string
  flagCode: string
  textDirection: 'ltr' | 'rtl'
  foodIndexLanguageBackendId?: string
}
```

Field notes:

- `id` is the locale's unique identifier across the system, for example `en_GB`.
- `englishName` is the display name shown in the admin interface.
- `localName` is the display name in the locale's own language.
- `respondentLanguage` is the IETF BCP 47 language tag for the survey interface, e.g. `en`, `en-GB`, `ar-AE`.
- `adminLanguage` uses the same tag format and controls the admin tool language independently.
- `flagCode` is a two-letter country code used to look up the locale's flag icon.
- `textDirection` is `ltr` for left-to-right scripts and `rtl` for right-to-left scripts such as Arabic.
- `foodIndexLanguageBackendId` selects the language-specific search backend (stemming, phonetic matching). Defaults to `en` when absent.

## foods.json {#format-foods}

`foods.json` contains food records grouped by locale. A single file can carry food definitions for multiple locales.

The file is a JSON object where each key is a locale ID and each value is an array of food records for that locale. Each food contains:

```ts
{
  code: string
  version?: string
  name: string
  englishName: string
  alternativeNames: Record<string, string[]>
  tags?: string[]
  attributes: InheritableAttributes
  parentCategories: string[]
  nutrientTableCodes: Record<string, string>
  portionSize: PortionSizeMethod[]
  associatedFoods: AssociatedFood[]
  brandNames: string[]
  thumbnailPath?: string
}
```

Field notes:

- `code` is unique within a locale but not globally across locales.
- `englishName` provides an English translation for the food name so system administrators can identify foods without needing to understand the local language.
- `alternativeNames` is keyed by language ID; each value is a non-empty list of non-empty strings. All names resolve to the same food code and are indexed for search.
- `parentCategories` is a list of category codes. A food can belong to multiple categories including ones from different branches of the category structure.
- `nutrientTableCodes` maps nutrient table ID to the food's record ID within that table. The format allows multiple entries; the current implementation uses one.
- `portionSize` contains the food-level portion size methods. Foods can also inherit methods from parent categories.
- `associatedFoods` are suggestions of foods commonly consumed together with this food, shown when this food is reported.
- `brandNames` are free-text brand name strings associated with the food.

### Associated foods

```ts
{
  orderBy: string
  foodCode?: string
  categoryCode?: string
  promptText: LocaleTranslation
  linkAsMain: boolean
  genericName: LocaleTranslation
  multiple?: boolean
}
```

Field notes:

- `foodCode` and `categoryCode` are mutually exclusive. `foodCode` adds that food automatically when the respondent accepts the prompt. `categoryCode` prompts the respondent to pick a specific food from that category.
- `promptText` is the question shown to the respondent.
- `genericName` is the placeholder name displayed before the respondent makes a specific selection, for example `sauce` or `bread`.
- `linkAsMain` reverses which food is presented as the main item in the interface. By default the associated food is a sub-item.
- `multiple` allows the respondent to select more than one food in response to this prompt.

## categories.json {#format-categories}

`categories.json` contains category records grouped by locale. Categories serve several purposes: they organise the food database for manual browsing; they carry inheritable attributes and portion size methods that are applied to child foods; and they group foods semantically for use in prompts such as associated food suggestions, sandwich builders, and study-specific questions like salt type selection.

The file is a JSON object where each key is a locale ID and each value is an array of category records for that locale. Each category contains:

```ts
{
  version?: string
  code: string
  englishName: string
  name: string
  tags?: string[]
  hidden: boolean
  attributes: InheritableAttributes
  parentCategories: string[]
  portionSize: PortionSizeMethod[]
}
```

Field notes:

- `englishName` provides an English translation for the category name so system administrators can identify categories without needing to understand the local language.
- `hidden` categories are excluded from both the search index and the browsing interface. They are intended as utility categories for use in associated food prompts, sandwich builders, and other prompts that reference a category directly rather than presenting it through the food browsing UI.
- `parentCategories` contains parent category codes. A category may have any number of parent categories, provided there are no cycles in the structure.
- `portionSize` on a category is inherited by child foods and categories that do not define their own methods. Inheritance is transitive — methods propagate down through the full category hierarchy — and can be overridden at any child category or individual food level.

## Portion size methods

Portion size methods describe how Intake24 prompts the respondent to estimate the amount consumed. They can be defined directly on a food or on a category for inheritance.

All methods share these fields:

```ts
{
  method: string
  description: string
  pathways: Array<'addon' | 'afp' | 'recipe' | 'search'>
  conversionFactor: number
  orderBy: string
}
```

Field notes:

- `method` is the discriminator identifying the method type; see sections below.
- `description` is a translation key from a predefined list used when the respondent must choose between multiple methods for the same food, for example `use_an_image` or `in_a_bowl`.
- `pathways` lists the contexts in which this method is active: `search` (normal food logging), `addon` (add-on foods), `afp` (associated food prompts), `recipe` (recipe builder).
- `conversionFactor` adjusts the weight derived from the portion size method before it is used in nutrient calculation. It is useful when the portion size images are not a perfect match for the food — for example, when a shared image set shows a heavier or denser variant of the same food.
- `orderBy` controls the display order when a food has more than one method.

### `as-served`

The respondent picks the photo that most closely matches the amount served from a sequence of weighed food images, then optionally does the same for leftovers.

```ts
{
  servingImageSet: string
  leftoversImageSet?: string
  labels?: boolean
  multiple?: boolean
}
```

Field notes:

- `servingImageSet` references a set in `portion-size/as-served.json`.
- `leftoversImageSet` references an optional separate set used for the leftovers step.
- `labels` controls whether weight labels are shown on the images.
- `multiple` enables quantity selection for multiple identical portions.

### `guide-image`

A single annotated image with selectable outlined regions, for example different sizes of whole fruit or containers. The respondent picks the closest match then enters a quantity multiplier.

```ts
{
  guideImageId: string
  labels?: boolean
}
```

Field notes:

- `guideImageId` references a record in `portion-size/guide-images.json`.
- `labels` controls whether weight labels are shown alongside the regions.

### `drink-scale`

Used for drinks. The respondent selects the type of drinkware, then marks the fill level on a scale overlay.

```ts
{
  drinkwareId: string
  initialFillLevel: number
  skipFillLevel: boolean
  labels?: boolean
  multiple?: boolean
}
```

Field notes:

- `drinkwareId` references a set in `portion-size/drinkware-sets.json`.
- `initialFillLevel` is the pre-set fill level shown when the slider first appears, normalised between 0 (empty) and 1 (full).
- `skipFillLevel` omits the fill-level question entirely, useful for fixed-volume containers such as standard takeaway cups.
- `multiple` enables quantity selection for multiple identical drinks.

### `standard-portion`

Named standard units with fixed weight in grams, for example `slice` or `tablespoon`, instead of portion size images.

```ts
{
  units: Array<{
    name: string
    weight: number
    omitFoodDescription: boolean
    inlineEstimateIn?: string
    inlineHowMany?: string
  }>
}
```

Field notes:

- `name` is a predefined unit key that is translated automatically into the study locale's language.
- `weight` is the weight of one unit in grams.
- `omitFoodDescription` removes the food name from the prompt text for this unit, to avoid awkward constructions where the unit name echoes the food name — for example, "how many fillets of salmon fillet" or "how many rolls of white bread roll".
- `inlineEstimateIn` and `inlineHowMany` override the predefined unit translation key with food-specific custom strings. Both must be provided together or both omitted.

### `cereal`

Selects a bowl type, then estimates the amount using an as-served image sequence specific to that cereal style.

```ts
{
  type: 'hoop' | 'flake' | 'rkris'
  labels?: boolean
}
```

Field notes:

- `type` selects the image set family: `hoop` for hoop-shaped cereals, `flake` for flakes, `rkris` for Rice Krispies-style puffed rice.

### `milk-on-cereal`

Estimates milk poured over cereal. Only applicable for sub-foods added to a cereal entry — for example via an associated food prompt. Reuses the bowl type already chosen by the `cereal` method on the parent food.

Additional field: `labels?: boolean`.

### `milk-in-a-hot-drink`

Estimates milk added to a hot drink. Each option value is the milk-to-drink ratio applied during calculation.

```ts
{ options: LocaleOptionList<number> }
```

### `parent-food-portion`

Calculates the amount relative to the parent food's estimated portion weight. Supports different ratio options per category.

```ts
{ options: CategoryLocaleOptionList<number> }
```

### `auto`

Applies a fixed amount without any respondent input.

```ts
{
  mode: 'weight' | 'weight-per-100g-parent'
  value: number
}
```

Field notes:

- `mode: 'weight'` uses `value` as the weight in grams directly.
- `mode: 'weight-per-100g-parent'` treats `value` as grams per 100 g of the parent food and scales it by the parent's estimated weight.

### `pizza` / `pizza-v2`

Multi-step pizza portion workflow covering size, shape, thickness, slice count, and quantity. `pizza-v2` is a revised version of the same flow. Additional field: `labels?: boolean`.

### `direct-weight`

The respondent types in an exact weight or volume. No additional fields.

### `unknown`

Placeholder for undefined portion size method data. Additional field: `weight?: number | null`.

## portion-size/as-served.json {#format-as-served}

`as-served.json` contains image sets used by the `as-served` portion size method. Each set is an ordered sequence of weighed food photographs with a separate chooser thumbnail.

The file is a flat array of set records. Each item contains:

```ts
{
  id: string
  description: string
  selectionImagePath: string
  label: LocaleTranslation | null
  images: Array<{
    imagePath: string
    imageKeywords: string[]
    weight: number
    label: LocaleTranslation | null
  }>
}
```

Field notes:

- `selectionImagePath` is the thumbnail image shown to the respondent when choosing a portion size estimation method, in case more than one method is defined for the food.
- `imageKeywords` are tags on the source image used for internal search and filtering.
- `weight` is the weight in grams of the amount shown in the photograph.
- `label` on both the set and individual images is a locale translation that can be shown as a caption. `null` means no label.

## portion-size/guide-images.json {#format-guide-images}

`guide-images.json` contains guide image definitions used by the `guide-image` portion size method. Each record links an image map to weight in grams for its selectable objects.

The file is a flat array. Each item contains:

```ts
{
  id: string
  description: string
  imageMapId: string
  objectWeights: Record<number, number>
  label?: LocaleTranslation
}
```

Field notes:

- `imageMapId` references a record in `portion-size/image-maps.json`.
- `objectWeights` maps image map object ID to weight in grams. The keys correspond to the `objects` keys in the referenced image map.

## portion-size/drinkware-sets.json {#format-drinkware}

`drinkware-sets.json` contains drinkware definitions used by the `drink-scale` portion size method. Each set provides a container-selection image map and one volume scale per drinkware option.

The file is a flat array. Each item contains:

```ts
{
  id: string
  description: string
  selectionImageMapId: string
  label?: LocaleTranslation
  scales: Record<number, DrinkScale>
}
```

Field notes:

- `selectionImageMapId` references the image map used for the drinkware selection step.
- `scales` is keyed by the image map object ID that corresponds to each drinkware choice.

Version 1 scales are deprecated. Each scale must use version 2:

```ts
{
  version: 2
  label: LocaleTranslation
  baseImagePath: string
  outlineCoordinates: number[]
  volumeSamples: number[]
  volumeMethod: 'lookUpTable' | 'cylindrical'
}
```

Field notes:

- `outlineCoordinates` is a flat `[x, y, x, y, ...]` polygon tracing the inner boundary of the fillable part of the container. x values are divided by the image width, y values by the image height, so all values are in the range [0, 1]. For example, a point at pixel (320, 240) on a 400×300 image becomes (0.8, 0.8).
- `volumeSamples` is a flat array of `[fillLevel, volume, fillLevel, volume, ...]` pairs. Fill levels are normalised on import relative to the full scale height so the maximum becomes 1 — for example, if fill levels are measured in millimetres and a full glass is 120 mm, a sample at 60 mm would become 0.5. Volumes are in millilitres.
- `volumeMethod` controls how the slider position is converted to millilitres. `lookUpTable` linearly interpolates between the measured fill-level/volume sample pairs — use when calibration data is available. `cylindrical` derives the filled volume geometrically from `outlineCoordinates`: the polygon is split down its vertical axis of symmetry, and the left-hand profile is rotated around that axis to approximate the container as a solid of revolution; the resulting fractional fill volume is then scaled to the maximum measured volume from `volumeSamples`.

## portion-size/image-maps.json {#format-image-maps}

`image-maps.json` contains the base images with polygon-outlined selectable regions used by both guide images and drinkware sets.

The file is a flat array. Each item contains:

```ts
{
  id: string
  description: string
  baseImagePath: string
  objects: Record<number, {
    description: string
    navigationIndex: number
    outlineCoordinates: number[]
  }>
}
```

Field notes:

- `objects` is keyed by object ID. These IDs are used to reference objects from `guide-images.json` (`objectWeights`) and `drinkware-sets.json` (`scales`).
- `navigationIndex` sets the keyboard/accessibility navigation order across the objects in the map.
- `outlineCoordinates` is a flat `[x, y, x, y, ...]` array defining the object's clickable area as a polygon. Both x and y are divided by the image width — **width, not height, is used for the y axis too** — so on a square image all values are in [0, 1], but on a portrait image y values can exceed 1. For example, a point at pixel (200, 300) on a 400×600 image becomes (0.5, 0.75). At render time coordinates are multiplied by the displayed image width to produce pixel positions, and the polygon is rendered as an SVG `<polygon>` for both visual display and click/hover hit detection.

## Examples

Each section below shows a complete, minimal JSON file containing representative records. Records are taken from a real French food database where available; for portion size methods not present in that database, illustrative records are used instead.

### locales.json

```json
[
  {
    "id": "fr_example",
    "englishName": "Example French locale",
    "localName": "Exemple de locale française",
    "respondentLanguage": "fr",
    "adminLanguage": "fr",
    "flagCode": "fr",
    "textDirection": "ltr",
    "foodIndexLanguageBackendId": "fr"
  }
]
```

[Click here for format description](#format-locales)

`respondentLanguage`, `adminLanguage`, and `foodIndexLanguageBackendId` are all `fr`, selecting French UI language and French stemming/phonetic search. `englishName` provides an English translation for the locale name so system administrators can identify and manage locales from different regions without needing to understand the local language.

### foods.json

```json
{
  "fr_example": [
    {
      "code": "24F1001",
      "name": "Baguette tradition",
      "englishName": "Traditional baguette",
      "alternativeNames": {
        "fr": ["Pain ou boule de tradition française"]
      },
      "tags": ["Facette-lieu-préparation", "Facette-rayon-achat", "yes-no-brand"],
      "attributes": { "sameAsBeforeOption": true, "reasonableAmount": 300 },
      "parentCategories": ["WBRD"],
      "nutrientTableCodes": { "FR_EXAMPLE": "1001" },
      "portionSize": [
        {
          "method": "direct-weight",
          "description": "weight",
          "pathways": ["search", "afp"],
          "conversionFactor": 1,
          "orderBy": "0"
        },
        {
          "method": "guide-image",
          "description": "use_an_image",
          "pathways": ["search", "afp"],
          "conversionFactor": 0.822,
          "orderBy": "1",
          "guideImageId": "ALBANE_French_Breads"
        },
        {
          "method": "standard-portion",
          "description": "use_a_standard_portion",
          "pathways": ["search", "afp"],
          "conversionFactor": 1,
          "orderBy": "2",
          "units": [
            {
              "name": "ALBANE_1001_1",
              "weight": 50,
              "omitFoodDescription": true,
              "inlineEstimateIn": "petit pain individuel",
              "inlineHowMany": "Combien de petit pain individuel"
            },
            {
              "name": "ALBANE_1001_2",
              "weight": 250,
              "omitFoodDescription": true,
              "inlineEstimateIn": "baguette entière",
              "inlineHowMany": "Combien de baguette entière"
            }
          ]
        }
      ],
      "associatedFoods": [
        {
          "orderBy": "0",
          "categoryCode": "BTTR",
          "promptText": { "fr": "Avez-vous tartiné une matière grasse sur ce pain ?" },
          "linkAsMain": false,
          "genericName": { "fr": "matière grasse" },
          "multiple": false
        },
        {
          "orderBy": "1",
          "categoryCode": "SUGR",
          "promptText": { "fr": "Avez-vous tartiné quelque chose sur ce pain (confiture, pâté, fromage frais) ?" },
          "linkAsMain": false,
          "genericName": { "fr": "matière grasse" },
          "multiple": false
        }
      ],
      "brandNames": []
    },
    {
      "code": "24F15019",
      "name": "Filet de bœuf",
      "englishName": "Beef tenderloin",
      "alternativeNames": {},
      "tags": ["Facette-méthode-cuisson", "Facette-Ajout-MG"],
      "attributes": { "sameAsBeforeOption": true, "reasonableAmount": 400 },
      "parentCategories": ["MEAT"],
      "nutrientTableCodes": { "FR_EXAMPLE": "15019" },
      "portionSize": [
        {
          "method": "as-served",
          "description": "use_an_image",
          "pathways": ["search", "afp"],
          "conversionFactor": 1,
          "orderBy": "0",
          "servingImageSet": "ALBANE_773",
          "multiple": true
        }
      ],
      "associatedFoods": [
        {
          "orderBy": "0",
          "categoryCode": "COND",
          "promptText": { "fr": "Avez-vous consommé cette viande avec une sauce chaude ou froide (mayonnaise, ...) ?" },
          "linkAsMain": false,
          "genericName": { "fr": "assaisonnement" },
          "multiple": false
        }
      ],
      "brandNames": []
    }
  ]
}
```

[Click here for format description](#format-foods)

**Baguette tradition (24F1001)** has `englishName: "Traditional baguette"` — an English translation of the local food name so administrators can identify it without needing to understand French.

It has one `alternativeNames` entry: `"Pain ou boule de tradition française"` under `fr`. Alternative names are indexed for search alongside the main `name`, so a respondent typing "boule de tradition" would find this food. All alternative names resolve to the same food code.

`tags` is a list of arbitrary text strings that can be used by the survey configuration to control the recall flow. In this database they are used to determine which "facet" questions are applicable to a given food — for example `"Facette-lieu-préparation"` marks foods for which a "where was it prepared?" question should be shown, and `"yes-no-brand"` marks foods for which a brand name question is applicable. The tags have no fixed meaning in the format itself; their interpretation depends entirely on the survey logic.

`nutrientTableCodes` links this food to its record in a nutrient composition table. The key is the nutrient table ID (`"FR_EXAMPLE"`) and the value is the record ID within that table (`"1001"`). Intake24 uses this reference during data export to calculate nutrient values for this food based on the portion size weight reported by the respondent. Multiple entries are allowed by the format, but the current implementation expects one.

The food has three portion size methods offered in order: direct weight entry, a guide image of French breads, and named standard units. When multiple methods are available, the respondent chooses the one that best suits how they remember the amount.

The guide image method uses `conversionFactor: 0.822`. The `ALBANE_French_Breads` image set is of a different food than this specific baguette — the raw object weights from the image are multiplied by this factor to arrive at the correct weight for this food.

The standard portion units use `inlineEstimateIn` and `inlineHowMany` to define ad-hoc unit descriptions for this specific food only, instead of using one of the global pre-defined units: one unit for an individual roll (50 g) and one for a full baguette (250 g). `omitFoodDescription: true` prevents the food name from being prepended to the prompt text, which would produce an awkward sentence when combined with the custom text.

Both associated food prompts ask whether something was spread on the bread. They reference categories (`BTTR` for fats, `SUGR` for sweet spreads and toppings) rather than a specific food, so the respondent is shown a list to choose from rather than having a single food added automatically.

`genericName` is the placeholder shown in the diary while no specific item has been selected yet — here `"matière grasse"` (fat/spread).

`linkAsMain: false` means the spread is recorded as a sub-item of the bread.

`multiple: false` means only one item can be selected per prompt.

**Filet de bœuf (24F15019)** is a simpler record with a single as-served method and one associated food prompt.

`multiple: true` on the as-served method lets the respondent pick more than one image from the sequence — useful for meat where someone might have eaten two fillets rather than one.

The associated food prompt asks about an accompanying sauce. `genericName: "assaisonnement"` is the placeholder shown before the respondent picks a specific condiment.

`linkAsMain: false` means the sauce is recorded as a sub-item of the steak rather than the other way around.

`multiple: false` limits the prompt to a single selection.

### categories.json

```json
{
  "fr_example": [
    {
      "code": "CSTD",
      "name": "Crème patissière",
      "englishName": "Custard",
      "hidden": false,
      "attributes": { "useInRecipes": 0 },
      "parentCategories": ["PUDS"],
      "portionSize": []
    },
    {
      "code": "19LDFC",
      "name": "Spécialités fromagères végétales",
      "englishName": "Lactose/Dairy-free cheese",
      "hidden": false,
      "attributes": {},
      "parentCategories": ["CHES"],
      "portionSize": []
    },
    {
      "code": "FRFSEL",
      "name": "Sel (pour la facette)",
      "englishName": "Salt (for salt facet)",
      "hidden": true,
      "attributes": {},
      "parentCategories": [],
      "portionSize": []
    }
  ]
}
```

[Click here for format description](#format-categories)

All three categories have an `englishName` — an English translation of the local category name so administrators can identify them without needing to understand the local language.

`CSTD` sets `useInRecipes: 0`, making custard available both as a standalone food and as a recipe ingredient; this attribute is inherited by all foods in the category unless a food overrides it.

`FRFSEL` is a utility category backing a special study-specific salt question — `hidden: true` excludes it from both the search index and the browsing interface, as it is only intended to be referenced by a prompt directly.

`19LDFC` is a straightforward category with an empty `attributes` object, meaning all attributes are inherited from parent categories.

### portion-size/as-served.json

```json
[
  {
    "id": "ALBANE_006",
    "description": "Biscuits salés pour l'apéritif",
    "selectionImagePath": "source/as_served/ALBANE_006/d15c666c-48a3-40d6-90f1-46241ebaf307.jpg",
    "label": null,
    "images": [
      {
        "imagePath": "source/as_served/ALBANE_006/e7f1366b-dd25-428d-8196-12bebba2f26c.jpg",
        "imageKeywords": [],
        "weight": 20,
        "label": null
      },
      {
        "imagePath": "source/as_served/ALBANE_006/afc2b6e0-d2d0-4963-974d-fa1256645175.jpg",
        "imageKeywords": [],
        "weight": 40,
        "label": null
      },
      {
        "imagePath": "source/as_served/ALBANE_006/ba090a0a-01fc-43b3-9279-ca3754185de4.jpg",
        "imageKeywords": [],
        "weight": 60,
        "label": null
      },
      {
        "imagePath": "source/as_served/ALBANE_006/7aebac28-dc51-4f43-b25d-c66e6adb53d1.jpg",
        "imageKeywords": [],
        "weight": 80,
        "label": null
      }
    ]
  },
  {
    "id": "ALBANE_028",
    "description": "Cacahuètes et pistaches",
    "selectionImagePath": "source/as_served/ALBANE_028/9845ecf8-bc05-4661-8b9c-9931665cd341.jpg",
    "label": null,
    "images": [
      {
        "imagePath": "source/as_served/ALBANE_028/64782327-5514-4a6b-8c33-80669c6371dd.jpg",
        "imageKeywords": [],
        "weight": 30,
        "label": null
      },
      {
        "imagePath": "source/as_served/ALBANE_028/c0b3dee9-7786-4e42-9df9-9c0eb7f7b419.jpg",
        "imageKeywords": [],
        "weight": 50,
        "label": null
      },
      {
        "imagePath": "source/as_served/ALBANE_028/8a70ad3a-fab8-4fe1-ac7c-4497b445f05f.jpg",
        "imageKeywords": [],
        "weight": 70,
        "label": null
      },
      {
        "imagePath": "source/as_served/ALBANE_028/53d6a182-9af5-42ec-ac81-a375f19eb552.jpg",
        "imageKeywords": [],
        "weight": 100,
        "label": null
      }
    ]
  }
]
```

[Click here for format description](#format-as-served)

Both sets are of savoury snack foods and each covers a statistically likely weight range across four images.

All labels are `null` here — labels can hold localised caption text displayed alongside each image when needed.

When a package is exported with images included, the actual image files are placed under `images/` in the archive at the same relative paths — so `imagePath: "source/as_served/ALBANE_006/e7f1366b-....jpg"` corresponds to `images/source/as_served/ALBANE_006/e7f1366b-....jpg` inside the zip.

### portion-size/guide-images.json

```json
[
  {
    "id": "ABS_Takeaway Containers Rect",
    "description": "ABS_Takeaway Containers Rect",
    "imageMapId": "ABS_Takeaway Containers Rect",
    "objectWeights": {
      "0": 600,
      "1": 1000,
      "2": 700
    },
    "label": null
  },
  {
    "id": "ABS_Takeaway Containers Square",
    "description": "ABS_Takeaway Containers Square",
    "imageMapId": "ABS_Takeaway Containers Square",
    "objectWeights": {
      "0": 250,
      "1": 800,
      "2": 400
    },
    "label": null
  }
]
```

[Click here for format description](#format-guide-images)

An image map is a base photograph with polygon-outlined selectable regions. A guide image builds on an image map by assigning a weight in grams to each region, turning a visual selection into a portion weight. The same image map can be reused by multiple guide images with different `objectWeights`, allowing the same photograph to be used for foods of different densities or preparation styles — for example, an image of grapes could be reused for olives with different weights.

Both guide images here are for takeaway containers, each with three sizes: small, medium, and large. The rectangular and square container variants share the same image map layout but have different weights per object, reflecting the different capacities of the two container shapes.

### portion-size/drinkware-sets.json

```json
[
  {
    "id": "wine_glasses",
    "description": "Wine glasses",
    "selectionImageMapId": "wine_glasses",
    "label": { "en": "Wine glasses", "fr": "Verres à vin" },
    "scales": {
      "1": {
        "version": 2,
        "label": { "en": "Small wine glass", "fr": "Petit verre de vin" },
        "baseImagePath": "drinkware/wine_glasses/small.jpg",
        "outlineCoordinates": [0.40, 0.10, 0.60, 0.10, 0.65, 0.45, 0.70, 0.90, 0.30, 0.90, 0.35, 0.45],
        "volumeSamples": [1, 175],
        "volumeMethod": "cylindrical"
      },
      "2": {
        "version": 2,
        "label": { "en": "Large wine glass", "fr": "Grand verre de vin" },
        "baseImagePath": "drinkware/wine_glasses/large.jpg",
        "outlineCoordinates": [0.38, 0.10, 0.62, 0.10, 0.68, 0.45, 0.72, 0.90, 0.28, 0.90, 0.32, 0.45],
        "volumeSamples": [1, 250],
        "volumeMethod": "cylindrical"
      }
    }
  }
]
```

[Click here for format description](#format-drinkware)

The set has two wine glass sizes. The respondent first picks a glass from the selection image map, then adjusts the fill level on a slider for whichever glass they chose.

Both scales use `volumeMethod: "cylindrical"` because wine glasses are rotationally symmetric. A single capacity measurement per glass is enough — 175 ml for the small and 250 ml for the large — and the fill volume is derived geometrically from the outline coordinates.

### portion-size/image-maps.json

```json
[
  {
    "id": "ABS_Takeaway Containers Rect",
    "description": "ABS_Takeaway Containers Rect",
    "baseImagePath": "source/food_thumbnail/67518/b12a18a7-0960-4c4a-885b-9269d38f3ace.jpg",
    "objects": {
      "0": {
        "description": "Small",
        "navigationIndex": 0,
        "outlineCoordinates": [0.202, 0.373, 0.323, 0.424, 0.318, 0.437, 0.313, 0.450, 0.312, 0.453, 0.312, 0.456, 0.310, 0.460, 0.307, 0.460, 0.306, 0.469, 0.304, 0.497, 0.214, 0.517, 0.167, 0.520, 0.080, 0.474, 0.050, 0.405]
      },
      "1": {
        "description": "Large",
        "navigationIndex": 1,
        "outlineCoordinates": [0.679, 0.362, 0.786, 0.341, 0.951, 0.388, 0.922, 0.483, 0.847, 0.502, 0.835, 0.506, 0.820, 0.502, 0.801, 0.492, 0.784, 0.489, 0.771, 0.482, 0.742, 0.471, 0.719, 0.463, 0.693, 0.451]
      },
      "2": {
        "description": "Medium",
        "navigationIndex": 2,
        "outlineCoordinates": [0.492, 0.356, 0.541, 0.372, 0.627, 0.398, 0.604, 0.489, 0.573, 0.500, 0.555, 0.500, 0.537, 0.509, 0.502, 0.512, 0.472, 0.502, 0.439, 0.485, 0.387, 0.466, 0.364, 0.382]
      }
    }
  },
  {
    "id": "wine_glasses",
    "description": "Wine glasses",
    "baseImagePath": "drinkware/wine_glasses/selection.jpg",
    "objects": {
      "1": {
        "description": "Small wine glass",
        "navigationIndex": 0,
        "outlineCoordinates": [0.28, 0.05, 0.45, 0.05, 0.48, 0.40, 0.52, 0.85, 0.20, 0.85, 0.24, 0.40]
      },
      "2": {
        "description": "Large wine glass",
        "navigationIndex": 1,
        "outlineCoordinates": [0.55, 0.05, 0.74, 0.05, 0.78, 0.42, 0.82, 0.85, 0.50, 0.85, 0.54, 0.42]
      }
    }
  }
]
```

[Click here for format description](#format-image-maps)

`ABS_Takeaway Containers Rect` is referenced by both guide images in the guide-images.json example. `wine_glasses` is the selection image map for the drinkware set — illustrating that the same image map format is used for both guide image selection and drinkware vessel selection.

The object IDs in `objects` are the same keys used in `objectWeights` (guide-images.json) and `scales` (drinkware-sets.json), linking each outlined region to its weight or volume scale definition.

### Portion size methods

One example per method showing the complete PSM object.

#### `as-served`

```json
{
  "method": "as-served",
  "description": "use_an_image",
  "pathways": ["search", "afp"],
  "conversionFactor": 1,
  "orderBy": "0",
  "servingImageSet": "ALBANE_773",
  "multiple": true
}
```

`multiple: true` allows the respondent to specify a quantity alongside the serving image, useful for foods where the respondent may have had seconds or multiple portions of the same food.

#### `guide-image`

```json
{
  "method": "guide-image",
  "description": "use_an_image",
  "pathways": ["search", "afp"],
  "conversionFactor": 0.822,
  "orderBy": "1",
  "guideImageId": "ALBANE_French_Breads"
}
```

`conversionFactor` less than 1 scales the object weights from the image down to match this specific food, which is lighter than the items shown in the shared image set.

#### `drink-scale`

```json
{
  "method": "drink-scale",
  "description": "use_an_image",
  "pathways": ["search", "afp"],
  "conversionFactor": 0.19,
  "orderBy": "1",
  "drinkwareId": "FR_Verrines",
  "initialFillLevel": 0.9,
  "skipFillLevel": false
}
```

`conversionFactor: 0.19` converts the volume reported by the scale (in ml) to grams — the drinkware set records volumes, not weights. `initialFillLevel: 0.9` pre-selects the initial fill level, which is useful for cases where a standard fill is expected (e.g. takeaway cups that are typically served full).

#### `standard-portion`

```json
{
  "method": "standard-portion",
  "description": "use_a_standard_portion",
  "pathways": ["search", "afp"],
  "conversionFactor": 1,
  "orderBy": "2",
  "units": [
    {
      "name": "ALBANE_1001_1",
      "weight": 50,
      "omitFoodDescription": true,
      "inlineEstimateIn": "petit pain individuel",
      "inlineHowMany": "Combien de petit pain individuel"
    }
  ]
}
```

`inlineEstimateIn` and `inlineHowMany` override the auto-translated unit name with custom prompt text. `omitFoodDescription: true` drops the food name from the question, which would otherwise be prepended automatically.

#### `direct-weight`

```json
{
  "method": "direct-weight",
  "description": "weight",
  "pathways": ["search", "afp"],
  "conversionFactor": 1,
  "orderBy": "0"
}
```

No extra fields. The respondent types in a weight or volume directly.

#### `unknown`

```json
{
  "method": "unknown",
  "description": "unknown",
  "pathways": ["search", "afp"],
  "conversionFactor": 1,
  "orderBy": "3",
  "weight": 10
}
```

Used as a fallback when no proper method could be assigned. `weight: 10` provides a fixed default of 10 g if the method is invoked.

#### `auto`

```json
{
  "method": "auto",
  "description": "use_a_standard_portion",
  "pathways": ["search"],
  "conversionFactor": 1,
  "orderBy": "0",
  "mode": "weight",
  "value": 10
}
```

`mode: "weight"` with `value: 10` always assigns 10 g without asking the respondent anything — useful for individually packaged items with a fixed weight, such as a butter portion sachet.

#### `cereal`

```json
{
  "method": "cereal",
  "description": "use_an_image",
  "pathways": ["search"],
  "conversionFactor": 1,
  "orderBy": "0",
  "type": "flake",
  "labels": true
}
```

`type: "flake"` selects the flake-specific image set family. The respondent first picks a bowl type, then estimates the fill level using that family's as-served image sequence.

#### `milk-on-cereal`

```json
{
  "method": "milk-on-cereal",
  "description": "use_an_image",
  "pathways": ["search"],
  "conversionFactor": 1,
  "orderBy": "1",
  "labels": true
}
```

Only applicable as an associated food for cereals — reuses the bowl type the respondent already chose for the cereal to estimate the milk amount.

#### `milk-in-a-hot-drink`

```json
{
  "method": "milk-in-a-hot-drink",
  "description": "use_a_standard_portion",
  "pathways": ["search"],
  "conversionFactor": 1,
  "orderBy": "0",
  "options": {
    "en": [
      { "label": "A little (splash)", "value": 0.1 },
      { "label": "Medium amount", "value": 0.2 },
      { "label": "A lot (half and half)", "value": 0.5 }
    ]
  }
}
```

Each option value is the ratio of milk to hot drink. The selected ratio is multiplied by the estimated hot drink volume to derive the milk amount. The volume of the main drink is reduced to compensate.

#### `parent-food-portion`

```json
{
  "method": "parent-food-portion",
  "description": "use_a_standard_portion",
  "pathways": ["search", "afp"],
  "conversionFactor": 1,
  "orderBy": "0",
  "options": {
    "_default": {
      "en": [
        { "label": "Less than the food (a quarter)", "value": 0.25 },
        { "label": "About the same as the food", "value": 1.0 },
        { "label": "More than the food", "value": 1.5 }
      ]
    }
  }
}
```

Used for foods whose amount is naturally described relative to another food already logged — for example gravy relative to meat. The selected ratio is applied to the parent food's estimated weight. Category-specific option lists can be added alongside `_default` to offer different ratios depending on which category the parent food belongs to.

#### `pizza`

```json
{
  "method": "pizza",
  "description": "use_an_image",
  "pathways": ["search"],
  "conversionFactor": 1,
  "orderBy": "0",
  "labels": false
}
```

Walks the respondent through a multi-step pizza workflow: size and shape, thickness, slice fraction, and quantity.

#### `pizza-v2`

```json
{
  "method": "pizza-v2",
  "description": "use_an_image",
  "pathways": ["search"],
  "conversionFactor": 1,
  "orderBy": "0",
  "labels": false
}
```

Revised version of the pizza workflow with an updated estimation flow.
