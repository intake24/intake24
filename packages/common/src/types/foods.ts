import { z } from 'zod';

import { requiredLocaleTranslation } from './common';

export const useInRecipeTypes = {
  USE_ANYWHERE: 0,
  USE_AS_REGULAR_FOOD: 1,
  USE_AS_RECIPE_INGREDIENT: 2,
} as const;

export type UseInRecipeType = (typeof useInRecipeTypes)[keyof typeof useInRecipeTypes];

export const foodTypes = ['free-text', 'encoded-food', 'missing-food', 'recipe-builder'] as const;
export type FoodType = (typeof foodTypes)[number];

export const recipeFoodStep = z.object({
  recipeFoodsId: z.string(),
  code: z.string(),
  localeId: z.string(),
  name: requiredLocaleTranslation,
  description: requiredLocaleTranslation,
  categoryCode: z.string(),
  repeatable: z.boolean(),
  required: z.boolean(),
  order: z.number(),
});
export type RecipeFoodStep = z.infer<typeof recipeFoodStep>;

export const recipeFood = z.object({
  code: z.string(),
  name: z.string(),
  localeId: z.string(),
  recipeWord: z.string(),
  synonyms: z.object({ synonyms: z.string() }).optional(),
  steps: recipeFoodStep.array(),
});
export type RecipeFood = z.infer<typeof recipeFood>;

export const recipeFoodsHeader = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string(),
  name: z.string(),
  synonyms: z.set(z.string()),
  recipeWord: z.string(),
});
export type RecipeFoodsHeader = z.infer<typeof recipeFoodsHeader>;
