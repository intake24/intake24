# Image processing

Path: `apps/api/src/config/image-processor.ts`

The strategy for managing image uploads in Intake24 is to accept image files of
any size/resolution.

Before they are served to clients the images are resized to and cached at
a specific standardised size configurable in this section.

The source image files are stored separately so the standard-sized images can
be recreated at any time without loss of data.

All the sizes below are measured in pixels.

## Source images

Any image uploaded to the system is first stored as-is as a 'source' image before
being processed and resized for use in a specific portion size estimation method.

Source image thumbnails are used for previews in the image management section
of the admin interface.

### Thumbnail width

- object-path: `source.thumbnailWidth`
- dotenv var: `IMAGE_SOURCE_THUMB_WIDTH`
- type: `integer number`
- default: `768`

### Thumbnail height

- object-path: `source.thumbnailHeight`
- dotenv var: `IMAGE_SOURCE_THUMB_HEIGHT`
- type: `integer number`
- default: `432`

## As served images

### Main image size

The standard width of the 'as-served' portion size images. Height is
calculated automatically to preserve the aspect ratio of the original image.

- object-path: `asServed.width`
- dotenv var: `IMAGE_AS_SERVED_WIDTH`
- type: `integer number`
- default: `1000`

### Thumbnail image size

Smaller 'as-served' image previews displayed below the main image.

- object-path: `asServed.thumbnailWidth`
- dotenv var: `IMAGE_AS_SERVED_THUMB_WIDTH`
- type: `integer number`
- default: `200`

## Image maps

Image maps are images containing several objects that the user can choose from by
clicking/tapping on a specific object.

The shapes of the object are stored separately in vector form and are overlaid at
runtime and this setting affects the size of the base image.

Height is calculated automatically to preserve the aspect ratio of the original
image.

### Base image size width

- object-path: `imageMaps.width`
- dotenv var: `IMAGE_MAP_WIDTH`
- type: `integer number`
- default: `1000`

## Drink scales

Drink (also called sliding) scales are images of cups/mugs/glasses used to
estimate the volume of liquids.

Similar to image maps, the shape of the fillable volume is stored in vector form
and this setting applies to the base image.

Height is calculated automatically to preserve the aspect ratio of the original
image.

### Base image size width

- object-path: `drinkScale.width`
- dotenv var: `IMAGE_DRINK_SCALE_WIDTH`
- type: `integer number`
- default: `1000`

## Portion size estimation option selection

These images are used when there is more than one portion size estimation
method available and the respondent is asked to choose which one to use.

They are automatically generated from one of the portion size estimation images
and are arranged in a grid in the option selection screen.

### Option selection image width

- object-path: `optionSelection.width`
- dotenv var: `IMAGE_OPTION_SELECTION_WIDTH`
- type: `integer number`
- default: `300`

### Option selection image height

- object-path: `optionSelection.height`
- dotenv var: `IMAGE_OPTION_SELECTION_HEIGHT`
- type: `integer number`
- default: `200`

## Food thumbnail images

### Food thumbnail image width

- object-path: `foodThumbnailImage.width`
- dotenv var: `IMAGE_FOOD_THUMB_WIDTH`
- type: `integer number`
- default: `1000`
