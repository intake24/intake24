import { z } from 'zod';

import { safeIdentifier } from '../generic';
import { nutrientTypeResponse } from './nutrient-types';

export const nutrientTableAttributes = z.object({
  id: safeIdentifier.max(32),
  description: z.string().max(512),
});

export type NutrientTableAttributes = z.infer<typeof nutrientTableAttributes>;

export const nutrientTableCsvMappingAttributes = z.object({
  nutrientTableId: z.string().max(32),
  rowOffset: z.coerce.number(),
  idColumnOffset: z.coerce.number(),
  descriptionColumnOffset: z.coerce.number(),
  localDescriptionColumnOffset: z.coerce.number().nullish(),
});

export type NutrientTableCsvMappingAttributes = z.infer<typeof nutrientTableCsvMappingAttributes>;

export const nutrientTableCsvMappingFieldAttributes = z.object({
  id: z.string(),
  nutrientTableId: z.string(),
  fieldName: z.string(),
  columnOffset: z.coerce.number(),
});

export type NutrientTableCsvMappingFieldAttributes = z.infer<
  typeof nutrientTableCsvMappingFieldAttributes
>;

export const nutrientTableCsvMappingNutrientAttributes = z.object({
  id: z.string(),
  nutrientTableId: z.string(),
  nutrientTypeId: z.string(),
  columnOffset: z.number(),
});

export type NutrientTableCsvMappingNutrientAttributes = z.infer<
  typeof nutrientTableCsvMappingNutrientAttributes
>;

export const nutrientTableResponse = nutrientTableAttributes.extend({
  csvMapping: nutrientTableCsvMappingAttributes,
  csvMappingFields: nutrientTableCsvMappingFieldAttributes.array(),
  csvMappingNutrients: nutrientTableCsvMappingNutrientAttributes.array(),
});

export type NutrientTableResponse = z.infer<typeof nutrientTableResponse>;

export const nutrientTableRequest = nutrientTableAttributes.extend({
  csvMapping: nutrientTableCsvMappingAttributes.omit({ nutrientTableId: true }),
  csvMappingFields: nutrientTableCsvMappingFieldAttributes
    .pick({ fieldName: true, columnOffset: true })
    .array()
    .refine((value) => {
      const fieldNames = value.map(field => field.fieldName);

      const noDups = [...new Set(fieldNames)];
      return fieldNames.length === noDups.length;
    }),
  csvMappingNutrients: nutrientTableCsvMappingNutrientAttributes
    .pick({ nutrientTypeId: true, columnOffset: true })
    .array()
    .refine((value) => {
      const nutrientTypeIds = value.map(nutrient => nutrient.nutrientTypeId);

      const noDups = [...new Set(nutrientTypeIds)];
      return nutrientTypeIds.length === noDups.length;
    }),
});

export type NutrientTableRequest = z.infer<typeof nutrientTableRequest>;

export type NutrientTableEntry = NutrientTableAttributes & {
  csvMapping: NutrientTableCsvMappingAttributes;
  csvMappingFields: NutrientTableCsvMappingFieldAttributes[];
  csvMappingNutrients: NutrientTableCsvMappingNutrientAttributes[];
};

export const nutrientTableRefs = z.object({
  nutrientTypes: nutrientTypeResponse.array(),
});

export type NutrientTableRefs = z.infer<typeof nutrientTableRefs>;

export const nutrientTableRecordRequest = z.object({
  recordId: z.string(),
  name: z.string(),
  localName: z.string().optional(),
  nutrients: z.array(z.tuple([z.string(), z.number()])),
  fields: z.array(z.tuple([z.string(), z.string()])),
});
export type NutrientTableRecordRequest = z.infer<typeof nutrientTableRecordRequest>;

export const nutrientTableRecordAttributes = z.object({
  id: z.string(),
  name: z.string(),
  localName: z.string().nullable(),
  nutrientTableId: z.string(),
  nutrientTableRecordId: z.string(),
});
export type NutrientTableRecordAttributes = z.infer<typeof nutrientTableRecordAttributes>;
