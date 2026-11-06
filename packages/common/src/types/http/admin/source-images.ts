import { z } from 'zod';

import { multerFile } from '../generic';

export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const imageMulterFile = multerFile.extend({
  mimetype: z.enum(allowedImageTypes),
});
export type ImageMulterFile = z.infer<typeof imageMulterFile>;

export const sourceImageTypes = [
  'image_maps',
  'as_served',
  'drink_scale',
  'food_thumbnail',
] as const;
export type SourceImageType = typeof sourceImageTypes[number];

export const sourceFileInput = z.object({
  originalname: z.string(),
  path: z.string(),
});
export type SourceFileInput = z.infer<typeof sourceFileInput>;

export const uploadSourceImageInput = z.object({
  id: z.string(),
  file: sourceFileInput,
  uploader: z.string(),
});
export type UploadSourceImageInput = z.infer<typeof uploadSourceImageInput>;
