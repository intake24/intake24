import { z } from 'zod';

import { localeTranslation } from '../../common';
import { safeIdentifier } from '../generic';
import { sourceFileInput } from './source-images';

export const imageMapObjectAttributes = z.object({
  id: z.string(),
  imageMapId: z.string(),
  description: z.string(),
  navigationIndex: z.coerce.number().int(),
  outlineCoordinates: z.coerce.number().array(),
  overlayImageId: z.string().nullable(),
  label: localeTranslation,
});
export type ImageMapObjectAttributes = z.infer<typeof imageMapObjectAttributes>;

export const imageMapEntryObject = imageMapObjectAttributes.pick({
  id: true,
  description: true,
  outlineCoordinates: true,
  label: true,
  navigationIndex: true,
});
export type ImageMapEntryObject = z.infer<typeof imageMapEntryObject>;

export const imageMapAttributes = z.object({
  id: safeIdentifier.max(32),
  description: z.string().min(1).max(512),
  label: localeTranslation,
  baseImageId: z.string(),
});
export type ImageMapAttributes = z.infer<typeof imageMapAttributes>;

export const createImageMapRequest = imageMapAttributes.pick({
  id: true,
  description: true,
  label: true,
}).partial({
  label: true,
}).extend({
  objects: imageMapEntryObject.array().default([]),
});
export type CreateImageMapRequest = z.infer<typeof createImageMapRequest>;

export const createImageMapInput = createImageMapRequest.extend({
  baseImage: sourceFileInput,
  uploader: z.string(),
});
export type CreateImageMapInput = z.infer<typeof createImageMapInput>;

export const updateImageMapInput = createImageMapInput.pick({
  description: true,
  label: true,
}).partial({
  label: true,
}).extend({
  objects: imageMapEntryObject.array(),
});
export type UpdateImageMapInput = z.infer<typeof updateImageMapInput>;

export const imageMapListEntry = imageMapAttributes.pick({
  id: true,
  description: true,
}).extend({
  imageUrl: z.string(),
});
export type ImageMapListEntry = z.infer<typeof imageMapListEntry>;

export const imageMapEntry = imageMapObjectAttributes.pick({
  id: true,
  description: true,
  label: true,
}).extend({
  baseImageUrl: z.string(),
  objects: imageMapEntryObject.array(),
});
export type ImageMapEntry = z.infer<typeof imageMapEntry>;
