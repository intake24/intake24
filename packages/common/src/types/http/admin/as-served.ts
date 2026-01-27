import { z } from 'zod';

import { localeTranslation } from '../../common';
import { safeIdentifier } from '../generic';
import { uploadSourceImageInput } from './source-images';

export const createAsServedImageRequest = z.object({
  label: localeTranslation.optional(),
  weight: z.coerce.number(),
});
export type CreateAsServedImageRequest = z.infer<typeof createAsServedImageRequest>;

export const createAsServedImageInput = createAsServedImageRequest.merge(uploadSourceImageInput);
export type CreateAsServedImageInput = z.infer<typeof createAsServedImageInput>;

export const asServedImageAttributes = z.object({
  id: z.string(),
  asServedSetId: z.string(),
  imageId: z.string(),
  label: localeTranslation,
  thumbnailImageId: z.string(),
  weight: z.number(),
});
export type AsServedImageAttributes = z.infer<typeof asServedImageAttributes>;

export const asServedImageEntry = asServedImageAttributes.pick({
  id: true,
  label: true,
  weight: true,
}).extend({
  mainImageUrl: z.string(),
  thumbnailUrl: z.string(),
});
export type AsServedImageEntry = z.infer<typeof asServedImageEntry>;

export const asServedSetAttributes = z.object({
  id: safeIdentifier.max(32),
  description: z.string().min(1).max(128),
  selectionImageId: z.string(),
  label: localeTranslation,
});
export type AsServedSetAttributes = z.infer<typeof asServedSetAttributes>;

export const createAsServedSetRequest = asServedSetAttributes.pick({
  id: true,
  description: true,
  label: true,
}).partial({
  label: true,
});
export type CreateAsServedSetRequest = z.infer<typeof createAsServedSetRequest>;

export const createAsServedSetInput = createAsServedSetRequest.merge(uploadSourceImageInput);
export type CreateAsServedSetInput = z.infer<typeof createAsServedSetInput>;

export const updateAsServedSetInput = createAsServedSetInput.pick({
  description: true,
  label: true,
}).partial({
  label: true,
}).extend({
  images: asServedImageAttributes
    .pick({ id: true, label: true, weight: true })
    .partial({ label: true })
    .array(),
});
export type UpdateAsServedSetInput = z.infer<typeof updateAsServedSetInput>;

export const asServedSetListEntry = asServedSetAttributes.pick({
  id: true,
  description: true,
}).extend({
  imageUrl: z.string(),
});
export type AsServedSetListEntry = z.infer<typeof asServedSetListEntry>;

export const asServedSetEntry = asServedSetAttributes.pick({
  id: true,
  description: true,
}).extend({
  images: asServedImageEntry.array(),
  label: localeTranslation,
  selectionImageUrl: z.string(),
});

export type AsServedSetEntry = z.infer<typeof asServedSetEntry>;
