# Feedback schemes

## Introduction

The functions in [Feedback schemes](/admin/feedback/schemes) allow dietary feedback to be customised.
It is recommended to start with an existing feedback scheme, which can be adapted.

The `PREVIEW` button can be used to view changes during the customisation process.

## Properties

- `Name` - `feedback-scheme-wide` unique name

- `Type` - Placeholder to allow different types of feedback schemes in the future

- `Visibility` - Record visibility, valid options are `public` or `restricted` ([record visibility](/admin/acl/securables#record-visibility)).

- `Outputs` - List of outputs that are allowed / offered to user. Possible outputs are `print`, `download` and `email`.

- Physical data fields - List of physical data inputs / identifiers, which are required to be collected for feedback calculation for some outputs:
  - `Sex` - required if feedback is sex specific

  - `Weight`, `Height`, `Physical activity level` and `Weight target` required if feedback is intended to provide an indication of whether energy/calorie intake is 'high' or 'low' etc.

  - `Weight` similar to above required for feedback in meeting protein requirements

  - `Birth date` required for age specific feedback

- `Sections` - List of feedback sections included in feedback
  - `submissions` - shows submission history selection (section is always on the top)

  - `cards` – shows intake of selected nutrients, energy and foods

  - `meals` – shows information on e.g. contribution to total energy intake from meals

  - `topFoods` – shows top foods contributing to selected nutrient intake as pie charts

  - `rating` - 5-star rating with optional comment to be submitted by user

  - `custom section` - custom section to allow insertion of custom content

## Top foods

Settings to populate top foods feedback section. It controls top foods lists and nutrient composition pie charts.

### Number of foods

- allows to set number of top foods to display, remaining foods will be grouped as other food

- preferred colors can be assigned to each food, which will be displayed both in lists & pie charts

### Nutrient types

- list of nutrient types to be displayed, which translates to number of lists & pie charts per nutrient type

## Meals

Sets breakdown statistics per day for meals.

### Meal breakdown chart

Sets pie charts for meal contribution to selected nutrient type(s).

- `Meal colors` – preferred colors can be assigned for each meal
- `Nutrient types` - list of nutrient types to be displayed

### Meal summary table

Meal per-day breakdown table with selected meal specific fields.
List of columns to be displayed in meal per-day breakdown table. List can be re-ordered by drag & drop.

1. There are common field properties for all field types:
   - `header` - localized column header name

   - `value` - localized field value
     :::tip Value formatting
     If field value is empty, then field value is displayed as is. If additional formatting is needed, use `{value}` placeholder to display field value.
     :::

   - `type` - field type, possible values standard, custom or nutrient

2. Depending on selected field type, there are additional properties to be set:
   - `fieldId` - field id, which is used to match with meal specific field

**Standard field IDs**

- `Name` - Meal name (Breakfast, Lunch, Dinner, Snack, ...)
- `Time` - Meal time to display (HH:MM)
- `Hours` - Hours part of meal time to display (HH)
- `Minutes` - Minutes part of meal time minutes to display (MM)
- `Duration` - Meal duration in minutes

**Custom field IDs**

When `custom` field type is selected, `fieldId` must be set to match specific `meal prompt ID` from selected `survey scheme`.

**Nutrient field IDs**

When nutrient field type is selected, fieldId is generated automatically based on selected nutrient type list.

## Cards

List of cards (selected nutrients, foods, energy) to be included in feedback.

- `image` - image to be displayed in feedback
- `color` - preferred background color for card
- `show recommendations` - tick to show recommendations for selected nutrient type

There are couple of feedback card types that can be used:

### Character

Character card assigns a nutrient type, which needs to be matched with nutrient type in `demographic groups` to display in feedback.

#### Content

- `Nutrient type` - selects nutrient, food or energy variable
- `Sentiments` - sets feedback based on intake of selected nutrient type

### Nutrient group

Nutrient group allows grouping of nutrients (e.g. fatty acids or sugar types) & thresholds to provide aggregated intake.

- `Unit` & `Unit description` - sets unit of measure for nutrient group
- `Thresholds` - sets lower or upper limits, with message
- `Nutrients` - list of nutrients to be included in nutrient group for aggregated intake

### Five a day

Five a day defines `five-a-day` feedback for fruit & vegetables.

- `Unit` & `Unit description` - sets unit of measure for nutrient group

## Demographic groups

List of demographic groups definitions, used for matching with character cards based on the defined criteria.
Demographic groups can be edited or new ones created. In `Edit demographic group` or `New demographic group`:

### General

Allows selection of:

- `Card type` - selects card type to match with card

- `Nutrient type`

- `Nutrient rule type`: allows how nutrients are calculated and presents feedback based on consumption as follows:
  - `Energy divided by BMR`: energy intake divided by BMR, fitting to optimal intake (e.g. energy/calorie intake compared to recommendations)
  - `Percentage of energy`: contribution of the nutrient to energy intake (e.g. percent contribution of fat to total energy intake)
  - `Per unit of weight`: contribution of the nutrient per kg of body weight, fitting to optimal intake (e.g. protein intake per kg of body weight)
  - `Range`: Amount of nutrient consumed (e.g. grams of fibre)

- `Sex` allows sex specific content for feedback (e.g. iron recommendations)

- `Age` set age range to align with age specific dietary/nutrient recommendations

- `Height` set height range to align with height specific dietary/nutrient recommendations

- `Weight` set weight range to align with weight specific dietary/nutrient recommendations

### Scale sectors

Scale sections allow further customization of the feedback based on a range of intakes.

- `Sentiment` - Sentiment to be used for feedback calculation
- `Range` - Range to match actual intake24 with the scale sector
- `Show intake in` - sections where to display the intake, possible values are `summary` and `description`
- `Summary` - Summary of the scale sector displayed in card's summary below the image
- `Name` - Name of the scale sector displayed in card's pop-up title
- `Description` - Description of the scale sector displayed in card's pop-up body

## Henry coefficients

List of Henry coefficients used to calculate BMR which underpins some of the feedback calculations.

## Security

Record-level access for other researchers to edit feedback sections
