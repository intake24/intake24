---
{ "outline": { "level": [2, 3] } }
---

# Prompt types

Prompts / Prompts are divided into three groups:

- [standard](#standard-prompts) - Standard prompts
- [portion-size](#portion-size-prompts) - Portion-size estimation prompts
- [custom](#custom-prompts) - Custom / generic prompts

## Standard prompts

Prompts with standardized behavior tied to specific functionality. Usually only one can be used per scheme and functionality is often tied to specific scheme section.

### Addon foods prompt

Prompt to add additional foods as linked foods. Prompt can be added to `food`, `meal` or `survey` level.

- `entity` - type of lookup, either `category` or `food`
- `code` - `category` or `food` code to lookup
- `only ask for certain foods` - list of conditions to filter foods that should be offered in the prompt.

### Associated foods prompt

- `multiple` - allow multiple foods to be selected
- `hints` - hints to be displayed in the prompt based on the search query (inline alerts)

#### Food browser settings

- **Show categories first**
  - `food browse list` - Show categories first in the browse list
  - `food search list` - Show categories first in the search list

### Edit meal prompt

Edit meal prompt allows initial entry of food and drink before portion-size estimation.

- `separateDrinks` - show drinks separately
- `hints` - hints to be displayed in the prompt based on the search query (pop-up alerts)

### External source prompt

Prompt to collect external source of food matching.

#### Source options

- `type` - external source type / provider
  - `open-food-facts` - Open Food Facts
    - `country` - country code
    - `query` - key:value pairs of query parameters

#### Barcode options

- `none` - no barcode scanner
- `quagga` - [Quagga2](https://github.com/ericblade/quagga2) barcode scanner (open-source)
- `strich` - [Strich](https://strich.io/) barcode scanner (subscription-based)

### Final prompt

Terminal prompt that is shown at the end of the recall. It offers home button It can offer feedback is applicable (feedback enabled and submission threshold reached).

- `rating` - 5-star rating with optional comment to be submitted after the recall

### Food search prompt

- `hints` - hints to be displayed in the prompt based on the search query (inline alerts)

#### Food browser settings

- **Show categories first**
  - `food browse list` - Show categories first in the browse list
  - `food search list` - Show categories first in the search list

### Meal add prompt

Prompt to add new meals. Multi-select list of options predefined in the scheme meal list.

#### Options

- `custom` - allow adding custom meal names
- `unique` - allow adding only unique meal names

### Meal duration prompt

Prompt to collect meal duration in minutes.

:::tip
Prompt uses slider component as [slider-prompt](/admin/surveys/prompt-types#slider-prompt), but it is more constrained, keep in mind that:

- meal duration is always in minutes
- labels should reflect the minutes unit

:::

#### Slider settings

- `current` - current duration in minutes
  - `label` - label to be displayed
  - `value` - current value
  - `size` - droplet size (in `px`) of the label
- `min` - minimum duration in minutes
  - `label` - label to be displayed at the start of the slider (min value) (use `{value}` to insert variable value into the label)
  - `value` - minimum value
- `max` - maximum duration in minutes
  - `label` - label to be displayed at the end of the slider (max value) (use `{value}` to insert variable value into the label)
  - `value` - maximum value
- `step` - step size in minutes

### Meal gap prompt

Prompt to remind user about meal gap between meals.

#### Options

- `gap` - time gap between meals (minutes)
- `startTime` - day start time
- `endTime` - day end time

### Meal time prompt

Prompt to collect meal time information using standard time picker.

#### Options

- `allowedMinutes` - allowed minutes for selection (`1`, `5`, `10`, `15`, `20`, `30`)

- `format` - time format (`am/pm` or `24h`)

- `AM/PM toggle` - `true` or `false` whether to show AM/PM toggle buttons

### Ready meal prompt

Prompt to collect ready meal information. Multi-select list of options, for each food within the meal that has `ready-meal` attribute set to `true`.

### Recall date prompt

Prompt to collect recall date information.

- `current` - highlighted current date offset in days
- `min` - minimum date offset in days
- `max` - maximum date offset in days

### Redirect prompt

Prompt to redirect user to external site with optional user identifier embedded into URL.

#### Options

- `rating` - 5-star rating with optional comment to be submitted after the recall

- `url` - URL to redirect to
  - use `{identifier}` variable as a placeholder where the user identifier should be to inserted.
  - example: `https://example.com/?arg={identifier}`

- `identifier` - identifier that should be embedded into the URL.
  - `userId` - internal intake24 user id
  - `username` - survey-unique respondent username
  - `urlAuthToken` - URL authentication token
  - `custom` - custom identifier that can be set through `userCustomField`.
    - Enter a `name` of the custom field to be looked up the `value`.

- `target` - target window for redirection
  - `_blank` - open in a new window
  - `_self` - open in the same window

- `timer` - optional timer in seconds when automatic redirection should occur
  - if set to `0`, timed redirection is disabled
  - if set to negative value, redirection is immediate

### Review confirm prompt

### Same as before prompt

Prompt to detect foods that are the same as in the previous recalls / meals and offer to use the same portion-size estimation.

### Sleep schedule prompt

Prompt to collect sleep schedule information (wake-up time and bedtime).

#### Options

- `allowedMinutes` - allowed minutes for selection (`1`, `5`, `10`, `15`, `20`, `30`)

- `format` - time format (`am/pm` or `24h`)

- `AM/PM toggle` - `true` or `false` whether to show AM/PM toggle buttons

### Split food prompt

Prompt to identify foods that can potentially be split into separate foods.

### Submit prompt

Prompt with recap of the recall and submit button.

#### Options

- `review` - defines rules (per layout, `desktop | mobile`) how review step is enforced before submission
  - `false` - no review step, submit button is always enabled
  - `scroll` - button is enabled when scrolled through the meal list to the end
  - `checkbox` - button is enabled when all meal checkboxes are ticked
  - `onecheckbox` - button is enabled when one survey level checkbox is ticked

## Portion-size prompts

Prompts for food portion-size estimation. Only one can be used per scheme and functionality is tied `foods` scheme section.

### As-served prompt

#### Options

- `badges` - show quantity badge on expansion panel header

- `leftovers` - show leftovers option

- `multiple` - allow multiple items to be selected. When enabled, additional options are available:
  - `false` - disable multiple selection
  - `counter` - counter-style multiple selection
  - `slider` - slider-style multiple selection

- `image map settings` - image map settings
  - `labels` - show image map labels (options are `always ON` / `always OFF` / `portion size method setting`)
  - `pinchZoom` - show PinchZoom control for mobile UI labels

### Cereal prompt

#### Options

- `badges` - show quantity badge on expansion panel header

- `leftovers` - show leftovers option

- `image map settings` - image map settings
  - `labels` - show image map labels (options are `always ON` / `always OFF` / `portion size method setting`)
  - `pinchZoom` - show PinchZoom control for mobile UI labels

### Direct weight prompt

### Drink scale prompt

#### Options

- `badges` - show quantity badge on expansion panel header

- `leftovers` - show leftovers option

- `image map settings` - image map settings
  - `labels` - show image map labels (options are `always ON` / `always OFF` / `portion size method setting`)
  - `pinchZoom` - show PinchZoom control for mobile UI labels

- `multiple` - allow multiple items to be selected. When enabled, additional options are available:
  - `false` - disable multiple selection
  - `counter` - counter-style multiple selection
  - `slider` - slider-style multiple selection

#### Counter settings

- `current` - current value
- `min` - minimum value
- `max` - maximum value
- `confirm` - require confirmation
- `whole`- use whole numbers
- `fraction` - use fractions

#### Slider settings

- `current` - current value settings
  - `label` - label to be displayed
  - `value` - current value
  - `size` - droplet size (in `px`) of the label
- `min` - minimum value settings
  - `label` - label to be displayed at the start of the slider (min value) (use `{value}` to insert variable value into the label)
  - `value` - minimum value
- `max` - maximum value settings
  - `label` - label to be displayed at the end of the slider (max value) (use `{value}` to insert variable value into the label)
  - `value` - maximum value
- `confirm` - require confirmation

:::tip
Prompt uses slider component as [slider-prompt](/admin/surveys/prompt-types#slider-prompt), but it is more constrained, keep in mind that:

- slider has decrement/increment buttons, so `min` and `max` labels won't be displayed
- consider settings in context of `multiple` option that prompt is collecting - number if items related to selected food

:::

### Guide image prompt

#### Options

- `badges` - show quantity badge on expansion panel header

- `image map settings` - image map settings
  - `labels` - show image map labels (options are `always ON` / `always OFF` / `portion size method setting`)
  - `pinchZoom` - show PinchZoom control for mobile UI labels

- `linked quantity settings`
  - Allows to trigger quantity selection prompt for linked parent food
  - `Automatically apply linked quantity` - skips prompt panel with quantity selection
  - `Source categories to trigger` - child food's categories it should trigger on
  - `Parent categories to link` - parent food's categories it should trigger on
    - Optional standard unit can be assigned to set the `how-many` label

### Milk in a hot drink prompt

#### Options

- `badges` - show quantity badge on expansion panel header and option labels

- `orientation` - orientation of radio buttons (column/row)

### Milk on cereal prompt

#### Options

- `badges` - show quantity badge on expansion panel header

- `image map settings` - image map settings
  - `labels` - show image map labels (options are `always ON` / `always OFF` / `portion size method setting`)
  - `pinchZoom` - show PinchZoom control for mobile UI labels

### Parent food portion prompt

Calculates portion size based on parent food portion size.

#### Options

- `badges` - show quantity badge on expansion panel header and option labels

- `orientation` - orientation of radio buttons (column/row)

### Pizza prompt

First iteration for pizza estimation

#### Options

- `badges` - show quantity badge on expansion panel header

- `image map settings` - image map settings
  - `labels` - show image map labels (options are `always ON` / `always OFF` / `portion size method setting`)
  - `pinchZoom` - show PinchZoom control for mobile UI labels

### Pizza V2 prompt

Second iteration for pizza estimation

#### Options

- `image map settings` - image map settings
  - `labels` - show image map labels (options are `always ON` / `always OFF` / `portion size method setting`)
  - `pinchZoom` - show PinchZoom control for mobile UI labels

### Portion size option prompt

Portion size option selection prompt

### Recipe builder prompt

Recipe builder prompt for foods with multiple ingredients, such as sandwiches, salads etc. Recipe foods can be defined in [locales recipe-foods](/admin/localization/locales#recipe-foods).

- `hints` - hints to be displayed in the prompt based on the search query (inline alerts)

#### Food browser settings

- **Show categories first**
  - `food browse list` - Show categories first in the browse list
  - `food search list` - Show categories first in the search list

### Standard portion prompt

Prompt to collect portion size based on standard units.

### Unknown prompt

Prompt to mark with food with unknown portion size.

## Custom prompts

Prompts with customizable generic behavior. Custom prompts can be used multiple times per scheme as long as they are identified with scheme-unique [`Prompt ID`](/admin/surveys/prompt-editor#general).

### Aggregate choice prompt

Prompt to collect single option from a list of foods.

#### Options

- `options` - locale-specific list of options with properties:
  - `label` - user-facing displayed label
  - `value` - value stored in database
  - `selected` - flag to pre-select the option

- `as only for specified foods` - conditions to limit the foods to which the prompt is applicable

### Checkbox list prompt

Multi-select list of options.

#### Options

- `options` - locale-specific list of options with properties:
  - `label` - user-facing displayed label
  - `value` - value stored in database
  - `exclusive` - exclusive flag - if selected, other options are deselected
  - `selected` - flag to pre-select the option

- `other` - `true` or `false` whether to show 'other' option, free-form text input
- `min` - Minimum number of answers
- `max` - Maximum number of answers

### Date picker prompt

Prompt to collect date information.

- `current` - highlighted current date offset in days
- `min` - minimum date offset in days
- `max` - maximum date offset in days

### Info prompt

Informational prompt for acknowledging displayed information.

#### Video options

Allows to embed youtube video with optional settings.

- `videoId` - Youtube video ID
- `height` - video height (default: `1280`)
- `width` - video width (default: `720`)
- `autoContinue` - continue on video end
- `autoplay` - autoplay video
- `required` - video is required to be played in full to continue

#### Carousel options

Allows to present information in carousel/slide form.

- `variant` - graphical presentation
- `color` - carousel theme color
- `required` - carousel is required to be walked through to continue
- `items`
  - `image (desktop)` - image URL for desktop layout
  - `image (mobile)` - image URL for mobile layout
  - `text` - Text content (rich text editor)

### No more information prompt

Terminal prompt for `food` or `meal` when no more information is required. It should be placed in `foods` and `postFoods` sections respectively.

### Select prompt

Prompt to collect single or multiple option(s) from a list of options using select box.

#### Options

- `multiple` - `true` or `false` whether to allow multiple options to be selected

- `options` - locale-specific list of options with properties:
  - `label` - user-facing displayed label
  - `value` - value stored in database
  - `selected` - flag to pre-select the option

### Slider prompt

Prompt to collect numeric information using slider.

#### Slider options

- `current` - current value settings
  - `label` - label to be displayed
  - `value` - current value
  - `size` - droplet size (in `px`) of the label
- `min` - minimum value settings
  - `label` - label to be displayed at the start of the slider (min value) (use `{value}` to insert variable value into the label)
  - `value` - minimum value
- `max` - maximum value settings
  - `label` - label to be displayed at the end of the slider (max value) (use `{value}` to insert variable value into the label)
  - `value` - maximum value
- `step` - step size

### Radio list prompt

Single-select list of options.

- `options` - locale-specific list of options with properties:
  - `label` - user-facing displayed label
  - `value` - value stored in database
  - `selected` - flag to pre-select the option

- `other` - `true` or `false` whether to show 'other' option, free-form text input

- `orientation` - orientation of radio buttons (`column` or `row`)

### Textarea prompt

Prompt to offer free-form text input.

### Time picker prompt

Prompt to collect time information.

- `allowedMinutes` - allowed minutes for selection (`1`, `5`, `10`, `15`, `20`, `30`)

- `format` - time format (`am/pm` or `24h`)

- `AM/PM toggle` - `true` or `false` whether to show AM/PM toggle buttons

### Yes/no prompt

Prompt to collect `yes` / `no` (`true` / `false`) information presented as distinct buttons.
