import { z } from 'zod';
import { bigIntString } from '../generic';

export const mediaModels = ['FeedbackScheme', 'SurveyScheme'] as const;
export type MediaModel = (typeof mediaModels)[number];

export const commonCollections = ['default', 'tinymce'];
export const mediaCollections: Record<MediaModel, string[]> = {
  FeedbackScheme: [...commonCollections, 'feedback-schemes:card'],
  SurveyScheme: [...commonCollections, 'survey-schemes:carousel'],
};

export const createMediaRequest = z.object({
  name: z.string().min(1).max(512).nullish(),
  collection: z.string().min(1).max(64),
  global: z.boolean().default(false),
});
export type CreateMediaRequest = z.infer<typeof createMediaRequest>;

export const updateMediaRequest = createMediaRequest.extend({
  name: z.string().min(1).max(512).optional(),
  collection: z.string().min(1).max(512).optional(),
  global: z.boolean().optional(),
});
export type UpdateMediaRequest = z.infer<typeof updateMediaRequest>;

export const mediaAttributes = z.object({
  id: z.string().uuid(),
  modelId: bigIntString.nullable(),
  modelUuid: z.string().uuid().nullable(),
  modelType: z.string().max(64),
  disk: z.enum(['public', 'private']),
  collection: z.string().max(64),
  name: z.string().max(512),
  filename: z.string().max(512),
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
