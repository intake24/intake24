import { z } from 'zod';

import { localeTranslation } from '@intake24/common/types';

import { portionSizeMethodAttributes } from '../admin/portion-size-methods';

export const userPortionSizeMethod = portionSizeMethodAttributes
  .omit({ id: true })
  .extend({
    imageUrl: z.string(),
  });
export type UserPortionSizeMethod = z.infer<typeof userPortionSizeMethod>;

export const userAssociatedFoodPrompt = z.object({
  id: z.string(),
  foodCode: z.string().optional(),
  categoryCode: z.string().optional(),
  promptText: localeTranslation,
  linkAsMain: z.boolean(),
  genericName: localeTranslation,
  multiple: z.boolean(),
});

export type UserAssociatedFoodPrompt = z.infer<typeof userAssociatedFoodPrompt>;

export const userFoodData = z.object({
  id: z.string(),
  code: z.string(),
  localeId: z.string(),
  englishName: z.string(),
  localName: z.string(),
  kcalPer100g: z.number(),
  reasonableAmount: z.number(),
  readyMealOption: z.boolean(),
  sameAsBeforeOption: z.boolean(),
  portionSizeMethods: userPortionSizeMethod.array(),
  associatedFoodPrompts: userAssociatedFoodPrompt.array(),
  brandNames: z.array(z.string()),
  categories: z.array(z.string()),
  tags: z.array(z.string()),
  thumbnailImageUrl: z.string().optional(),
});

export type UserFoodData = z.infer<typeof userFoodData>;
