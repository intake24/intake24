# Image maps

Image maps allow to define selectable objects on uploaded image. They are used either independently or as base image for `guide image` or `drink scale`.

## Properties

- `Image map ID` - Unique string within `image map` records

- `Description` - Free text to describe the image map

- `Base image map file` - Image to be uploaded

## Object area editor

After record is created, object areas can be defined on image.

### Object area editor supports following functions:

- click on `plus` button adds new object
- to modify an object area, firstly select the object by clicking either or canvas object area or on the object's toolbar header
- `double-click` on canvas will create a node
- `double-click` on node will remove it
- `drag & drop` can be used to move the nodes about

### Existing object areas can be assigned with:

- `Description` - object's description (admin purposes)

- `Label` - object's localized label, display on hover/selection

:::tip Label settings
**Display** - Labels are displayed only when enabled in respective [prompt](/admin/surveys/prompt-types#portion-size-prompts)

If image map is used as base image for `guide image` or `drink scale`, then labels of respective records take precedence and image map labels are used as fallback
:::

## Deletion

- make sure that image map is not assigned to any `guide image` or `drink scale`
- Make sure that image map is not assigned to any of the portion size methods
