import { z } from 'zod';

import { localeTranslation } from '../../common';

export const associatedFood = z.object({
  foodCode: z.string().optional(),
  categoryCode: z.string().optional(),
  genericName: localeTranslation,
  promptText: localeTranslation,
  linkAsMain: z.boolean(),
  allowMultiple: z.boolean(),
});
export type AssociatedFood = z.infer<typeof associatedFood>;

export const associatedFoodAttributes = z.object({
  id: z.string(),
  foodId: z.string(),
  associatedFoodCode: z.string().nullable(),
  associatedCategoryCode: z.string().nullable(),
  text: localeTranslation,
  genericName: localeTranslation,
  linkAsMain: z.boolean(),
  multiple: z.boolean(),
  orderBy: z.string(),
});
export type AssociatedFoodAttributes = z.infer<typeof associatedFoodAttributes>;
