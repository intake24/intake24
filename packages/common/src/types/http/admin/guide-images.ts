import { z } from 'zod';

import { localeTranslation } from '../../common';
import { safeIdentifier } from '../generic';
import { imageMapEntry, imageMapEntryObject } from './image-maps';

export const guideImageObjectAttributes = z.object({
  id: z.string(),
  guideImageId: z.string(),
  weight: z.coerce.number(),
  imageMapObjectId: z.string(),
  label: localeTranslation,
});
export type GuideImageObjectAttributes = z.infer<typeof guideImageObjectAttributes>;

export const guideImageAttributes = z.object({
  id: safeIdentifier.max(32),
  description: z.string().min(1).max(128),
  imageMapId: z.string(),
  label: localeTranslation,
  selectionImageId: z.string(),
});
export type GuideImageAttributes = z.infer<typeof guideImageAttributes>;

export const guideImageEntryObject = imageMapEntryObject.extend({
  weight: z.coerce.number(),
});
export type GuideImageEntryObject = z.infer<typeof guideImageEntryObject>;

export const guideImageInputObject = guideImageEntryObject.pick({
  id: true,
  weight: true,
  label: true,
}).partial({
  label: true,
});
export type GuideImageInputObject = z.infer<typeof guideImageInputObject>;

export const createGuideImageInput = guideImageAttributes.pick({
  id: true,
  description: true,
  imageMapId: true,
  label: true,
}).partial({
  label: true,
});
export type CreateGuideImageInput = z.infer<typeof createGuideImageInput>;

export const updateGuideImageInput = createGuideImageInput.pick({
  description: true,
  label: true,
}).extend({
  objects: guideImageInputObject.array(),
});
export type UpdateGuideImageInput = z.infer<typeof updateGuideImageInput>;

export const guideImageListEntry = guideImageAttributes.pick({
  id: true,
  description: true,
}).extend({
  imageUrl: z.string(),
});
export type GuideImageListEntry = z.infer<typeof guideImageListEntry>;

export const guideImageEntry = imageMapEntry.extend({
  imageMapId: z.string(),
  objects: guideImageEntryObject.array(),
});
export type GuideImageEntry = z.infer<typeof guideImageEntry>;
