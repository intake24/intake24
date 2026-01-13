import { z } from 'zod';

export const pkgV2NutrientTableCsvMapping = z.object({
  rowOffset: z.number(),
  idColumnOffset: z.number(),
  descriptionColumnOffset: z.number(),
  localDescriptionColumnOffset: z.number().optional(),
});

export type PkgV2NutrientTableCsvMapping = z.infer<typeof pkgV2NutrientTableCsvMapping>;

export const pkgV2NutrientTableNutrientCsvMapping = z.object({
  nutrientTypeId: z.string(),
  columnOffset: z.number(),
});

export type PkgV2NutrientTableNutrientCsvMapping = z.infer<typeof pkgV2NutrientTableNutrientCsvMapping>;

export const pkgV2NutrientTableFieldCsvMapping = z.object({
  fieldName: z.string(),
  columnOffset: z.number(),
});

export type PkgV2NutrientTableFieldCsvMapping = z.infer<typeof pkgV2NutrientTableFieldCsvMapping>;

export const pkgV2NutrientTableRecord = z.object({
  recordId: z.string(),
  name: z.string(),
  localName: z.string().optional(),
  nutrients: z.array(z.tuple([z.string(), z.number()])),
  fields: z.array(z.tuple([z.string(), z.string()])),
});

export type PkgV2NutrientTableRecord = z.infer<typeof pkgV2NutrientTableRecord>;

export const pkgV2NutrientTable = z.object({
  id: z.string(),
  description: z.string(),
  csvMapping: pkgV2NutrientTableCsvMapping,
  csvNutrientMapping: z.array(pkgV2NutrientTableNutrientCsvMapping),
  csvFieldMapping: z.array(pkgV2NutrientTableFieldCsvMapping),
  records: z.array(pkgV2NutrientTableRecord),
});

export type PkgV2NutrientTable = z.infer<typeof pkgV2NutrientTable>;
