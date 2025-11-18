import { z } from 'zod';

export const supportedPackageFormats = ['json', 'xlsx'] as const;

export const packageIncludeOptions = [
  'foods',
  'categories',
  'portionSizeMethods',
  'portionSizeImages',
] as const;

export type PackageIncludeOption = typeof packageIncludeOptions[number];

export type PackageFormat = typeof supportedPackageFormats[number];

export const packageExportOptions = z.object({
  format: z.enum(supportedPackageFormats),
  locales: z.array(z.string()).nonempty(),
  options: z.object({
    include: z.array(z.enum(packageIncludeOptions)).nonempty(),
  }),
});

export type PackageExportOptions = z.infer<typeof packageExportOptions>;
