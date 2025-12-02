import { z } from 'zod';

import { toStandardUnitId } from '@intake24/common/util';

import { localeTranslation, requiredLocaleTranslation } from '../../common';

export const standardUnitAttributes = z.object({
  id: z.string(),
  name: z.string(),
  estimateIn: requiredLocaleTranslation,
  howMany: requiredLocaleTranslation,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StandardUnitAttributes = z.infer<typeof standardUnitAttributes>;

export const standardUnitRequest = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .transform(v => toStandardUnitId(v)),
  name: z.string().min(1).max(128),
  estimateIn: requiredLocaleTranslation,
  howMany: requiredLocaleTranslation,
});

export type StandardUnitRequest = z.infer<typeof standardUnitRequest>;

export const standardUnitCategory = z.object({
  id: z.string(),
  categoryCode: z.string(),
  localeId: z.string(),
  localeCode: z.string(),
  name: z.string(),
  simpleName: z.string(),
  altNames: localeTranslation,
  version: z.string().uuid(),
});

export type StandardUnitCategory = z.infer<typeof standardUnitCategory>;

export const standardUnitFood = z.object({
  id: z.string(),
  foodCode: z.string(),
  localeId: z.string(),
  localeCode: z.string(),
  name: z.string(),
  simpleName: z.string(),
  altNames: localeTranslation,
  version: z.string().uuid(),
});

export type StandardUnitFood = z.infer<typeof standardUnitFood>;
