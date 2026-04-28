# Guide images

`Guide image` is enhanced record of corresponding `image map`. `Guide image` allows to assign localized labels and weights to each object area defined in [Image map](/admin/images/image-maps).

:::tip
Setting up multiple independent `guide image` record of the same `image map` allows to assign different labels and weights for same `image map`.
:::

## Detail

- `Guide image ID` - Unique string within `guide image` records

- `Description` - Free text to describe the guide image

- `Image map` - Select existing [image map](/admin/images/image-maps) record to create new guide image

## Object area editor

After record is created, existing object areas can be assigned with:

- `Weight` - object's weight in grams

- `Label` - object's localized label, display on hover/selection

:::tip Label settings
**Display** - Labels are displayed only when enabled in [guide-image-prompt](/admin/surveys/prompt-types#guide-image-prompt)

**Formatting** - Food / Weight can be embedded into the label with `{food}` and `{weight}` variable placeholders, respectively.
:::

## Deletion

Make sure that guide image is not assigned to any of the portion size methods.
