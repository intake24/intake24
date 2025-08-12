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

// Special Foods | Foods Builder section

export const recipeFoodStepsType = z.object({
  order: z.number(),
  code: z.string(),
  recipeFoodsCode: z.string(),
  name: requiredLocaleTranslation,
  description: requiredLocaleTranslation,
  localeId: z.string(),
  categoryCode: z.string(),
  repeatable: z.boolean(),
  required: z.boolean(),
});
export type RecipeFoodStepsType = z.infer<typeof recipeFoodStepsType>;

export const recipeFood = z.object({
  code: z.string(),
  name: z.string(),
  recipeWord: z.string(),
  steps: recipeFoodStepsType.array(),
});
export type RecipeFood = z.infer<typeof recipeFood>;

export const recipeFoodsHeader = z.object({
  code: z.string(),
  description: z.string(),
  name: z.string(),
  synonyms: z.set(z.string()),
  recipeWord: z.string(),
});
export type RecipeFoodsHeader = z.infer<typeof recipeFoodsHeader>;
