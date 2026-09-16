import { z } from 'zod';

export const exportPackageFormats = ['json', 'xlsx'] as const;

export const importPackageFormats = ['intake24', 'albane'] as const;

export const packageIncludeOptions = [
  'locales',
  'foods',
  'categories',
  'synonymSets',
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
    xlsx: z.object({
      includeActionColumn: z.boolean().optional(),
    }).optional(),
  }),
});

export type PackageExportOptions = z.infer<typeof packageExportOptions>;

export const packageFileTypes = [
  'locales',
  'foods',
  'categories',
  'synonymSets',
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

// @tus/server's default naming function uses 16 random bytes encoded as hex.
// This validation ensures there are no path traversal symbols such as .. or /
export const uploadFileId = z.string().regex(/^[0-9a-f]{32}$/);

export const packageVerificationRequest = z.object({
  fileId: uploadFileId,
  packageFormat: z.enum(importPackageFormats),
});

export type PackageVerificationRequest = z.infer<typeof packageVerificationRequest>;

export const packageImportRequest = z.object({
  fileId: uploadFileId,
  verificationJobId: z.string().nonempty(),
  options: z.object({
    conflictStrategies: z.record(z.string(), z.string()),
    include: z.array(z.enum(packageFileTypes)),
    localeFilter: z.array(z.string()),
    foodFilter: z.array(z.string()).optional(),
    categoryFilter: z.array(z.string()).optional(),
  }),
});

export type PackageImportRequest = z.infer<typeof packageImportRequest>;
