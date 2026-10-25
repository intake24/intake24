import { z } from 'zod';

import { toStandardUnitId } from '@intake24/common/util';

import { localeTranslation, requiredLocaleTranslation } from '../../common';

export const standardUnitAttributes = z.object({
  id: z.string(),
  code: z.string().min(1).max(64).transform(v => toStandardUnitId(v)),
  localeId: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  estimateIn: requiredLocaleTranslation,
  howMany: requiredLocaleTranslation,
  icon: z.string().min(1).max(64).nullable(),
});
export type StandardUnitAttributes = z.infer<typeof standardUnitAttributes>;

export const standardUnitRequest = standardUnitAttributes.omit({ id: true, localeId: true }).partial({ icon: true });
export type StandardUnitRequest = z.infer<typeof standardUnitRequest>;

export const standardUnitCategory = z.object({
  id: z.string(),
  code: z.string(),
  categoryCode: z.string(),
  localeId: z.string(),
  localeCode: z.string(),
  name: z.string(),
  simpleName: z.string(),
  altNames: localeTranslation,
  version: z.uuid(),
});

export type StandardUnitCategory = z.infer<typeof standardUnitCategory>;

export const standardUnitFood = z.object({
  id: z.string(),
  code: z.string(),
  foodCode: z.string(),
  localeId: z.string(),
  localeCode: z.string(),
  name: z.string(),
  simpleName: z.string(),
  altNames: localeTranslation,
  version: z.uuid(),
});

export type StandardUnitFood = z.infer<typeof standardUnitFood>;
