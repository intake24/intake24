import { z } from 'zod';

import { portionSizeMethods, portionSizeParameter } from '@intake24/common/surveys';
import { localeTranslation } from '@intake24/common/types';

export const userPortionSizeMethod = z.object({
  method: z.enum(portionSizeMethods),
  description: z.string(),
  imageUrl: z.string(),
  useForRecipes: z.boolean(),
  conversionFactor: z.number(),
  orderBy: z.string(),
  parameters: portionSizeParameter,
});

export type UserPortionSizeMethod = z.infer<typeof userPortionSizeMethod>;

export const userAssociatedFoodPrompt = z.object({
  foodCode: z.string().optional(),
  categoryCode: z.string().optional(),
  promptText: localeTranslation,
  linkAsMain: z.boolean(),
  genericName: localeTranslation,
  multiple: z.boolean(),
});

export type UserAssociatedFoodPrompt = z.infer<typeof userAssociatedFoodPrompt>;

export const userFoodData = z.object({
  code: z.string(),
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
