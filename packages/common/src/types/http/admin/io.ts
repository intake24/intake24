import { z } from 'zod';

export const supportedPackageFormats = ['json', 'xlsx'] as const;

export type PackageFormat = typeof supportedPackageFormats[number];

export const packageExportOptions = z.object({
  format: z.enum(supportedPackageFormats),
  locales: z.array(z.string()).nonempty(),
  options: z.object({
    include: z.array(z.enum(['foods', 'categories', 'associatedFoodPrompts', 'portionSizeMethods', 'asServedImages', 'guideImages'])).nonempty(),
  }),
});

export type PackageExportOptions = z.infer<typeof packageExportOptions>;
