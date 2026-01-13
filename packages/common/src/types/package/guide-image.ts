import { z } from 'zod';

import { localeTranslationStrict } from '../common';

export const pkgV2GuideImage = z.object({
  id: z.string(),
  description: z.string(),
  imageMapId: z.string(),
  objectWeights: z.record(z.coerce.number(), z.number()),
  label: localeTranslationStrict.optional(),
});

export type PkgV2GuideImage = z.infer<typeof pkgV2GuideImage>;
