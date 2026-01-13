import { z } from 'zod';

import { localeTranslationStrict } from '../common';

export const pkgV2AsServedLabel = localeTranslationStrict.nullable();

export const pkgV2AsServedImage = z.object({
  imagePath: z.string(),
  imageKeywords: z.array(z.string()),
  weight: z.number(),
  label: pkgV2AsServedLabel,
});

export const pkgV2AsServedSet = z.object({
  id: z.string(),
  description: z.string(),
  selectionImagePath: z.string(),
  images: z.array(pkgV2AsServedImage),
  label: pkgV2AsServedLabel,
});

export type PkgV2AsServedLabel = z.infer<typeof pkgV2AsServedLabel>;
export type PkgV2AsServedImage = z.infer<typeof pkgV2AsServedImage>;
export type PkgV2AsServedSet = z.infer<typeof pkgV2AsServedSet>;
