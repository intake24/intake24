export const useInRecipeTypes = {
  USE_ANYWHERE: 0,
  USE_AS_REGULAR_FOOD: 1,
  USE_AS_RECIPE_INGREDIENT: 2,
} as const;
export type UseInRecipeType = (typeof useInRecipeTypes)[keyof typeof useInRecipeTypes];

export const foodTypes = ['free-text', 'encoded-food', 'missing-food', 'recipe-builder', 'generic-builder'] as const;
export type FoodType = (typeof foodTypes)[number];
