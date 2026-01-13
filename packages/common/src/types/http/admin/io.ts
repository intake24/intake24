import { z } from 'zod';

export const exportPackageFormats = ['json', 'xlsx'] as const;

export const importPackageFormats = ['intake24', 'albane'] as const;

export const packageIncludeOptions = [
  'locales',
  'foods',
  'categories',
  'portionSizeMethods',
  'portionSizeImages',
] as const;

export type PackageIncludeOption = typeof packageIncludeOptions[number];

export type ExportPackageFormat = typeof exportPackageFormats[number];

export type ImportPackageFormat = typeof importPackageFormats[number];

export const packageExportOptions = z.object({
  format: z.enum(exportPackageFormats),
  locales: z.array(z.string()).nonempty(),
  options: z.object({
    include: z.array(z.enum(packageIncludeOptions)).nonempty(),
  }),
});

export type PackageExportOptions = z.infer<typeof packageExportOptions>;

export const packageFileTypes = [
  'locales',
  'foods',
  'categories',
  'asServedSets',
  'imageMaps',
  'guideImages',
  'drinkwareSets',
  'nutrientTables',
] as const;

export type PackageFileType = typeof packageFileTypes[number];

export type PackageContentsSummary = {
  targetLocales: string[];
  files: Record<PackageFileType, boolean>;
};
