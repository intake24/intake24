import { z } from 'zod';

import { languageAttributes } from './languages';
import { systemLocaleAttributes } from './locales';
import { nutrientTableRecordAttributes } from './nutrient-tables';
import { standardUnitAttributes } from './standard-units';
import { surveyAttributes } from './surveys';

export const categoryReference = z.object({
  code: z.string(),
  name: z.string(),
});
export type CategoryReference = z.infer<typeof categoryReference>;

export const foodReference = z.object({
  code: z.string(),
  name: z.string(),
});
export type FoodReference = z.infer<typeof foodReference>;

export const languageReference = languageAttributes.pick({
  id: true,
  code: true,
  englishName: true,
  localName: true,
});
export type LanguageReference = z.infer<typeof languageReference>;

export const localeReference = systemLocaleAttributes.pick({
  id: true,
  code: true,
  englishName: true,
  localName: true,
});
export type LocaleReference = z.infer<typeof localeReference>;

export const nutrientTableRecordReference = nutrientTableRecordAttributes;
export type NutrientTableRecordReference = z.infer<typeof nutrientTableRecordReference>;

export const standardUnitReference = standardUnitAttributes.pick({
  id: true,
  name: true,
  estimateIn: true,
  howMany: true,
});
export type StandardUnitReference = z.infer<typeof standardUnitReference>;

export const surveyReference = surveyAttributes.pick({
  id: true,
  name: true,
  slug: true,
});
export type SurveyReference = z.infer<typeof surveyReference>;
