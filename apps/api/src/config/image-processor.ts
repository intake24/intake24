import z from 'zod';
import { validateConfig } from './validate-config';

export const sourceImageConfigSchema = z.object({
  thumbnailWidth: z.number().int().positive(),
  thumbnailHeight: z.number().int().positive(),
});

export type SourceImageConfig = z.infer<typeof sourceImageConfigSchema>;

export const asServedImageConfigSchema = z.object({
  width: z.number().int().positive(),
  thumbnailWidth: z.number().int().positive(),
});

export type AsServedImageConfig = z.infer<typeof asServedImageConfigSchema>;

export const selectionScreenImageConfigSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type SelectionScreenImageConfig = z.infer<typeof selectionScreenImageConfigSchema>;

export const foodThumbnailImageConfigSchema = z.object({
  width: z.number().int().positive(),
});

export type FoodThumbnailImageConfig = z.infer<typeof foodThumbnailImageConfigSchema>;

export const imageMapsConfigSchema = z.object({
  width: z.number().int().positive(),
});

export type ImageMapsConfig = z.infer<typeof imageMapsConfigSchema>;

export const slidingScaleConfigSchema = z.object({
  width: z.number().int().positive(),
});

export type SlidingScaleConfig = z.infer<typeof slidingScaleConfigSchema>;

export const imageProcessorConfigSchema = z.object({
  source: sourceImageConfigSchema,
  asServed: asServedImageConfigSchema,
  imageMaps: imageMapsConfigSchema,
  drinkScale: slidingScaleConfigSchema,
  optionSelection: selectionScreenImageConfigSchema,
  foodThumbnailImage: foodThumbnailImageConfigSchema,
});

export type ImageProcessorConfig = z.infer<typeof imageProcessorConfigSchema>;

const rawImageProcessorConfig = {
  source: {
    thumbnailWidth: Number.parseInt(process.env.IMAGE_SOURCE_THUMB_WIDTH || '768', 10),
    thumbnailHeight: Number.parseInt(process.env.IMAGE_SOURCE_THUMB_HEIGHT || '432', 10),
  },
  asServed: {
    width: Number.parseInt(process.env.IMAGE_AS_SERVED_WIDTH || '1000', 10),
    thumbnailWidth: Number.parseInt(process.env.IMAGE_AS_SERVED_THUMB_WIDTH || '200', 10),
  },
  imageMaps: {
    width: Number.parseInt(process.env.IMAGE_MAP_WIDTH || '1000', 10),
  },
  drinkScale: {
    width: Number.parseInt(process.env.IMAGE_DRINK_SCALE_WIDTH || '1000', 10),
  },
  optionSelection: {
    width: Number.parseInt(process.env.IMAGE_OPTION_SELECTION_WIDTH || '300', 10),
    height: Number.parseInt(process.env.IMAGE_OPTION_SELECTION_HEIGHT || '200', 10),
  },
  foodThumbnailImage: {
    width: Number.parseInt(process.env.IMAGE_FOOD_THUMB_WIDTH || '1000', 10),
  },
};

const parsedImageProcessorConfig = validateConfig('Image processor configuration', imageProcessorConfigSchema, rawImageProcessorConfig);

export default parsedImageProcessorConfig;
