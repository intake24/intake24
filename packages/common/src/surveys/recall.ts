import type { ExternalSource, PromptStates } from '../prompts';
import type { FoodType, RecipeFood } from '../types';
import type { Optional } from '../types/common';
import type { UserFoodData } from '../types/http';
import type { PortionSizeStates } from './portion-size';
import type { SurveySubmissionMissingFoodCreationAttributes } from '@intake24/db';

import { z } from 'zod';

import { requiredLocaleTranslationWithLimit } from '../types/common';
import { time } from '../util';

export const staticSurveyFlag = [
] as const;
export type StaticSurveyFlag = (typeof staticSurveyFlag)[number];
export const dynamicSurveyFlag = z.custom<`${string}-acknowledged` | `${string}-complete`>((val) => {
  return typeof val === 'string' && /-(?:acknowledged|complete)$/.test(val);
});
export type DynamicSurveyFlag = z.infer<typeof dynamicSurveyFlag>;
// export const surveyFlag = z.union([z.enum(staticSurveyFlag), dynamicSurveyFlag]);
export const surveyFlag = z.union([dynamicSurveyFlag, z.string()]);
export type SurveyFlag = z.infer<typeof surveyFlag>;

export const staticMealFlags = [
  'free-entry-complete',
  'no-meals-after',
  'no-meals-between',
  'no-meals-before',
  'ready-meal-complete',
  'meal-time:confirmed',
  'meal-time:disabled',
  'meal-time:hidden',
] as const;
export type StaticMealFlag = (typeof staticMealFlags)[number];
export const dynamicMealFlag = z.custom<`food-search:${string}` | `${string}-acknowledged` | `${string}-complete`>((val) => {
  return typeof val === 'string' && (val.startsWith('food-search:') || /-(?:acknowledged|complete)$/.test(val));
});
export type DynamicMealFlag = z.infer<typeof dynamicMealFlag>;
export const mealFlag = z.union([z.enum(staticMealFlags), dynamicMealFlag, z.string()]);
export type MealFlag = z.infer<typeof mealFlag>;

export const staticFoodFlags = [
  'is-drink',
  'link-as-main',
  'ready-meal',
  'same-as-before-complete',
  'split-food-complete',
  'missing-food-complete',
  'portion-size-option-complete',
  'portion-size-method-complete',
  'recipe-builder-complete',
  'associated-foods-complete',
  'disable-general-associated-foods',
] as const;
export type StaticFoodFlag = (typeof staticFoodFlags)[number];
export const dynamicFoodFlag = z.custom<`${string}-acknowledged`
  | `${string}-complete`
  | `search-category:${string}`
  | `search-category-toggle:${string}`>((val) => {
  return typeof val === 'string' && (val.startsWith('search-category') || val.startsWith('search-category-toggle') || /-(?:acknowledged|complete)$/.test(val));
});
export type DynamicFoodFlag = z.infer<typeof dynamicFoodFlag>;
export const foodFlags = z.union([z.enum(staticFoodFlags), dynamicFoodFlag, z.string()]);
export type FoodFlag = z.infer<typeof foodFlags>;

export const customPromptAnswer = z.union([
  z.string().max(2048),
  z.array(z.string().max(2048)),
  z.number(),
  z.array(z.number()),
  z.boolean(),
  z.array(z.boolean()),
  z.null(),
]);
export type CustomPromptAnswer = z.infer<typeof customPromptAnswer>;
export const customData = z.record(z.string(), customPromptAnswer);
export type CustomData = z.infer<typeof customData>;

export const recipeBuilderComponent = z.object({
  order: z.number(),
  ingredients: z.string().array(),
});
export type RecipeBuilderComponent = z.infer<typeof recipeBuilderComponent>;

export type ExternalSourceRecord = Record<ExternalSource, PromptStates['external-source-prompt'] | undefined>;

export interface AbstractFoodState {
  id: string;
  flags: FoodFlag[];
  linkedFoods: FoodState[];
  customPromptAnswers: CustomData;
  type: FoodType;
  external?: ExternalSourceRecord;
}

export interface FreeTextFood extends AbstractFoodState {
  type: 'free-text';
  description: string;
}

export interface EncodedFood extends AbstractFoodState {
  type: 'encoded-food';
  data: UserFoodData;
  searchTerm: string | null;
  portionSizeMethodIndex: number | null;
  portionSize: PortionSizeStates[keyof Omit<PortionSizeStates, 'recipe-builder'>] | null;
  // brand: string[]; TODO V3?
}

export interface MissingFood extends AbstractFoodState {
  type: 'missing-food';
  searchTerm: string | null;
  info: Pick<
    SurveySubmissionMissingFoodCreationAttributes,
    'name' | 'brand' | 'description' | 'leftovers' | 'portionSize' | 'barcode'
  > | null;
}

export interface RecipeBuilder extends AbstractFoodState {
  type: 'recipe-builder';
  searchTerm: string | null;
  components: RecipeBuilderComponent[];
  description: string;
  templateId: string;
  template: RecipeFood;
  markedAsComplete: number[];
}

export type FoodState = FreeTextFood | EncodedFood | MissingFood | RecipeBuilder;

export const mealState = z.object({
  id: z.string(),
  name: requiredLocaleTranslationWithLimit({ max: 64 }),
  defaultTime: time,
  time: time.optional(),
  duration: z.number().nullable(),
  flags: mealFlag.array(),
  customPromptAnswers: z.record(z.string(), customPromptAnswer),
  // TODO: type foods
  foods: z.custom<FoodState>(() => {
    return true;
  }).array(),
});

export type MealState = z.infer<typeof mealState>;

export type MealCreationState = Optional<
  Pick<MealState, 'name' | 'defaultTime' | 'time' | 'duration' | 'flags'>,
  'defaultTime' | 'time' | 'duration' | 'flags'
>;

export const selectedMeal = z.object({
  type: z.literal('meal'),
  mealId: z.string(),
});
export type SelectedMeal = z.infer<typeof selectedMeal>;

export const selectedFood = z.object({
  type: z.literal('food'),
  foodId: z.string(),
});
export type SelectedFood = z.infer<typeof selectedFood>;

export const selectionModes = ['manual', 'auto'] as const;
export const selectionMode = z.enum(selectionModes);

export type SelectionMode = (typeof selectionModes)[number];

export const selection = z.object({
  element: z.union([z.null(), selectedMeal, selectedFood]),
  mode: selectionMode,
});

export type Selection = z.infer<typeof selection>;

export const surveyState = z.object({
  id: z.string().uuid().optional(),
  schemeId: z.string().nullable(),
  recallDate: z.string().date().nullable(),
  startTime: z.coerce.date().nullable(),
  endTime: z.coerce.date().nullable(),
  submissionTime: z.coerce.date().nullable(),
  uxSessionId: z.string().uuid(),
  userAgent: z.string().nullish(),
  flags: surveyFlag.array(),
  customPromptAnswers: z.record(z.string(), customPromptAnswer),
  selection,
  meals: mealState.array(),
  wakeUpTime: z.string().time().nullable(),
  sleepTime: z.string().time().nullable(),
});

export type SurveyState = z.infer<typeof surveyState>;

export function isEncodedFood(food: FoodState): food is EncodedFood {
  return food.type === 'encoded-food';
}

export function getFoodDescription(food: FoodState): string {
  switch (food.type) {
    case 'free-text':
      return food.description;
    case 'encoded-food':
      return food.data.localName;
    default:
      return food.searchTerm ?? '';
  }
}

export function getSearchTerm(food: FoodState) {
  switch (food.type) {
    case 'free-text':
      return food.description;
    default:
      return food.searchTerm;
  }
}

export function isSelectionEqual(s1: Selection, s2: Selection): boolean {
  if (s1.mode === s2.mode) {
    if (s1.element !== null) {
      if (s2.element === null)
        return false;

      if (s1.element.type === 'food' && s2.element.type === 'food')
        return s1.element.foodId === s2.element.foodId;

      if (s1.element.type === 'meal' && s2.element.type === 'meal')
        return s1.element.mealId === s2.element.mealId;

      return false;
    }
    else {
      return s2.element === null;
    }
  }
  else {
    return false;
  }
}
