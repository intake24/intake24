import { z } from 'zod';

export const pkgV2Locale = z.object({
  id: z.string(),
  englishName: z.string(),
  localName: z.string(),
  respondentLanguage: z.string(),
  adminLanguage: z.string(),
  flagCode: z.string(),
  textDirection: z.union([z.literal('ltr'), z.literal('rtl')]),
  foodIndexLanguageBackendId: z.string().optional(),
});

export type PkgV2Locale = z.infer<typeof pkgV2Locale>;
