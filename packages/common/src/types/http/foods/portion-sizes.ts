import { z } from 'zod';

import {
  drinkwareScaleEntry,
  drinkwareScaleV2Entry,
  drinkwareSetEntry,
} from '@intake24/common/types/http/admin';

import { localeTranslation, requiredLocaleTranslation } from '../..';

export const asServedImageResponse = z.object({
  label: localeTranslation,
  mainImageUrl: z.string(),
  thumbnailUrl: z.string(),
  weight: z.number(),
});

export type AsServedImageResponse = z.infer<typeof asServedImageResponse>;

export const asServedSetResponse = z.object({
  id: z.string(),
  description: z.string(),
  label: localeTranslation,
  selectionImageUrl: z.string(),
  images: z.array(asServedImageResponse),
});

export type AsServedSetResponse = z.infer<typeof asServedSetResponse>;

export const imageMapObjectResponse = z.object({
  id: z.string(),
  description: z.string(),
  label: localeTranslation,
  navigationIndex: z.number(),
  outlineCoordinates: z.array(z.number()),
});

export type ImageMapObjectResponse = z.infer<typeof imageMapObjectResponse>;

export const imageMapResponse = z.object({
  id: z.string(),
  description: z.string(),
  label: localeTranslation,
  baseImageUrl: z.string(),
  objects: imageMapObjectResponse.array(),
});

export type ImageMapResponse = z.infer<typeof imageMapResponse>;

export const guideImageResponse = z.object({
  id: z.string(),
  description: z.string(),
  label: localeTranslation,
  imageMap: imageMapResponse,
  objects: z.record(z.string(), z.object({ label: localeTranslation, weight: z.number() })),
});

export type GuideImageResponse = z.infer<typeof guideImageResponse>;

export const drinkwareVolumeSampleResponse = z.object({
  fill: z.number(),
  volume: z.number(),
});

export type DrinkwareVolumeSampleResponse = z.infer<typeof drinkwareVolumeSampleResponse>;

// Only send normalised volume samples to survey app
export const drinkwareScaleV2Response = drinkwareScaleV2Entry.omit({ volumeSamples: true });
export type DrinkwareScaleV2Response = z.infer<typeof drinkwareScaleV2Response>;

export const drinkwareSetResponse = drinkwareSetEntry
  .omit({ description: true, scales: true })
  .extend({
    scales: z.union([drinkwareScaleEntry, drinkwareScaleV2Response]).array(),
  });

export type DrinkwareSetResponse = z.infer<typeof drinkwareSetResponse>;

export const standardUnitResponse = z.object({
  id: z.string(),
  name: z.string(),
  estimateIn: requiredLocaleTranslation,
  howMany: requiredLocaleTranslation,
});

export type StandardUnitResponse = z.infer<typeof standardUnitResponse>;

export const weightResponse = z.object({
  method: z.literal('weight'),
  description: z.string(),
  parameters: z.record(z.string(), z.never()),
  imageUrl: z.string(),
  useForRecipes: z.boolean(),
  conversionFactor: z.number(),
});

export type WeightResponse = z.infer<typeof weightResponse>;
