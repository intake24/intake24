import { z } from 'zod';
import { bigIntString } from '../generic';

export const mediaModels = ['FAQ', 'FeedbackScheme', 'SurveyScheme'] as const;
export type MediaModel = (typeof mediaModels)[number];

export const mediaDisks = ['public', 'private'] as const;
export type MediaDisk = (typeof mediaDisks)[number];

export const commonCollections = ['default', 'tinymce'];
export const modelCollections: Record<MediaModel, string[]> = {
  FAQ: [],
  FeedbackScheme: ['card'],
  SurveyScheme: ['carousel'],
};

export const withModel = z.object({
  modelId: bigIntString.nullable(),
  modelType: z.string().max(64),
});

export const createMediaRequest = z.object({
  name: z.string().max(128).nullish().transform(val => val || undefined),
  collection: z.string().min(1).max(128),
  disk: z.enum(mediaDisks),
});
export type CreateMediaRequest = z.infer<typeof createMediaRequest>;
export const createMediaWithModelRequest = createMediaRequest.merge(withModel);
export type CreateMediaWithModelRequest = z.infer<typeof createMediaWithModelRequest>;

export const updateMediaRequest = z.object({
  name: z.string().max(128).nullish().transform(val => val || undefined),
  collection: z.string().max(128).nullish().transform(val => val || undefined),
});
export type UpdateMediaRequest = z.infer<typeof updateMediaRequest>;

export const updateMediaWithModelRequest = updateMediaRequest.merge(withModel);
export type UpdateMediaWithModelRequest = z.infer<typeof updateMediaWithModelRequest>;

export const mediaAttributes = z.object({
  id: z.string().uuid(),
  modelId: bigIntString.nullable(),
  modelType: z.string().max(64),
  disk: z.enum(mediaDisks),
  collection: z.string().max(64),
  name: z.string().max(128),
  filename: z.string().max(128),
  mimetype: z.string().max(128),
  size: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MediaAttributes = z.infer<typeof mediaAttributes>;

export const mediaEntry = mediaAttributes.extend({
  url: z.string().url(),
  sizes: z.record(z.string(), z.string().url()),
});
export type MediaEntry = z.infer<typeof mediaEntry>;
