import { z } from 'zod';

import { localeTranslationStrict } from '../common';

export const pkgV2DrinkScaleV1 = z.object({
  version: z.literal(1),
  label: z.string(),
  width: z.number(),
  height: z.number(),
  emptyLevel: z.number(),
  fullLevel: z.number(),
  baseImagePath: z.string(),
  overlayImagePath: z.string(),
  volumeSamples: z.array(z.number()),
});

export const pkgV2DrinkScaleV2 = z.object({
  version: z.literal(2),
  label: localeTranslationStrict,
  baseImagePath: z.string(),
  outlineCoordinates: z.array(z.number()),
  volumeSamples: z.array(z.number()),
  volumeMethod: z.enum(['lookUpTable', 'cylindrical']),
});

export const pkgV2DrinkScale = z.discriminatedUnion('version', [
  pkgV2DrinkScaleV1,
  pkgV2DrinkScaleV2,
]);

export const pkgV2DrinkwareSet = z.object({
  id: z.string(),
  description: z.string(),
  selectionImageMapId: z.string(),
  scales: z.record(z.coerce.number(), pkgV2DrinkScale),
  label: localeTranslationStrict.optional(),
});

export type PkgV2DrinkScaleV1 = z.infer<typeof pkgV2DrinkScaleV1>;
export type PkgV2DrinkScaleV2 = z.infer<typeof pkgV2DrinkScaleV2>;
export type PkgV2DrinkScale = z.infer<typeof pkgV2DrinkScale>;
export type PkgV2DrinkwareSet = z.infer<typeof pkgV2DrinkwareSet>;
