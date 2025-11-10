import { z } from 'zod';

export const pkgV2AsServedImage = z.object({
  imagePath: z.string(),
  imageKeywords: z.array(z.string()),
  weight: z.number(),
});

export const pkgV2AsServedSet = z.object({
  id: z.string(),
  description: z.string(),
  selectionImagePath: z.string(),
  images: z.array(pkgV2AsServedImage),
  label: z.record(z.string()).optional(),
});

export type PkgV2AsServedImage = z.infer<typeof pkgV2AsServedImage>;
export type PkgV2AsServedSet = z.infer<typeof pkgV2AsServedSet>;
