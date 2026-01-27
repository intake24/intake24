import type { Pagination } from '../generic';

import { z } from 'zod';

import { localeTranslation } from '../../common';
import { safeIdentifier } from '../generic';

export const drinkwareScaleVolumeMethod = ['lookUpTable', 'cylindrical'] as const;
export type DrinkwareScaleVolumeMethod = typeof drinkwareScaleVolumeMethod[number];

export const drinkwareSetAttributes = z.object({
  id: safeIdentifier.max(32),
  description: z.string().min(1).max(128),
  imageMapId: z.string(),
  label: localeTranslation,
});
export type DrinkwareSetAttributes = z.infer<typeof drinkwareSetAttributes>;

export const createDrinkwareSetInput = drinkwareSetAttributes.pick({
  id: true,
  description: true,
  imageMapId: true,
  label: true,
}).partial({
  label: true,
});
export type CreateDrinkwareSetInput = z.infer<typeof createDrinkwareSetInput>;

export const drinkwareSetListEntry = drinkwareSetAttributes.pick({
  id: true,
  description: true,
}).extend({
  imageUrl: z.string(),
});
export type DrinkwareSetListEntry = z.infer<typeof drinkwareSetListEntry>;

export const drinkwareScaleAttributes = z.object({
  id: z.string(),
  drinkwareSetId: z.string(),
  width: z.coerce.number(),
  height: z.coerce.number(),
  emptyLevel: z.coerce.number(),
  fullLevel: z.coerce.number(),
  choiceId: z.string(),
  baseImageUrl: z.string().max(512),
  overlayImageUrl: z.string().max(512),
  label: localeTranslation,
});
export type DrinkwareScaleAttributes = z.infer<typeof drinkwareScaleAttributes>;

export const drinkwareScaleEntry = drinkwareScaleAttributes.pick({
  choiceId: true,
  width: true,
  height: true,
  emptyLevel: true,
  fullLevel: true,
  baseImageUrl: true,
  overlayImageUrl: true,
  label: true,
}).extend({
  version: z.literal(1),
  volumeSamples: z.array(z.number()),
});
export type DrinkwareScaleEntry = z.infer<typeof drinkwareScaleEntry>;

export const drinkwareScaleV2Attributes = z.object({
  id: z.string(),
  drinkwareSetId: z.string(),
  choiceId: z.string(),
  baseImageUrl: z.string().max(512),
  label: localeTranslation,
  outlineCoordinates: z.coerce.number().array(),
  volumeSamples: z.coerce.number().array(),
  volumeSamplesNormalised: z.coerce.number().array(),
  volumeMethod: z.enum(drinkwareScaleVolumeMethod),
});
export type DrinkwareScaleV2Attributes = z.infer<typeof drinkwareScaleV2Attributes>;

export const drinkwareScaleV2Entry = drinkwareScaleV2Attributes.pick({
  choiceId: true,
  baseImageUrl: true,
  label: true,
  outlineCoordinates: true,
  volumeSamples: true,
  volumeSamplesNormalised: true,
  volumeMethod: true,
}).extend({
  version: z.literal(2),
});
export type DrinkwareScaleV2Entry = z.infer<typeof drinkwareScaleV2Entry>;

export const updateDrinkwareScaleInput = drinkwareScaleV2Entry.pick({
  choiceId: true,
  label: true,
  outlineCoordinates: true,
  volumeSamples: true,
  volumeMethod: true,
}).partial({
  label: true,
  outlineCoordinates: true,
  volumeSamples: true,
  volumeMethod: true,
});
export type UpdateDrinkwareScaleInput = z.infer<typeof updateDrinkwareScaleInput>;

export const updateDrinkwareSetInput = drinkwareSetAttributes.pick({
  description: true,
  imageMapId: true,
  label: true,
}).partial({
  label: true,
}).extend({
  scales: updateDrinkwareScaleInput.array()
    .transform<Record<string, UpdateDrinkwareScaleInput>>(val =>
      val.reduce((acc, cur) => ({ ...acc, [cur.choiceId]: cur }), {})),
});
export type UpdateDrinkwareSetInput = z.infer<typeof updateDrinkwareSetInput>;

export const drinkwareSetEntry = drinkwareSetAttributes.extend({
  scales: z.union([drinkwareScaleEntry, drinkwareScaleV2Entry]).array(),
});

export type DrinkwareSetEntry = z.infer<typeof drinkwareSetEntry>;

export type DrinkwareSetsResponse = Pagination<DrinkwareSetListEntry>;
