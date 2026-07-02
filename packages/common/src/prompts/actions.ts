import { z } from 'zod';

import { variants } from '../theme';
import { localeTranslation } from '../types/common';
import { layoutTypes } from './partials';

export const genericActionTypes = ['addMeal', 'next', 'review'] as const;
export const mealActionTypes = [
  'deleteMeal',
  'editMeal',
  'mealTime',
  'selectMeal',
] as const;
export const foodActionTypes = [
  'addFood',
  'deleteFood',
  'editFood',
  'selectFood',
  'changeFood',
  'updateFood',
] as const;
export const actionTypes = [...genericActionTypes, ...mealActionTypes, ...foodActionTypes] as const;

export type GenericActionType = (typeof genericActionTypes)[number];
export type MealActionType = (typeof mealActionTypes)[number];
export type FoodActionType = (typeof foodActionTypes)[number];
export type ActionType = (typeof actionTypes)[number];

export const actionItem = z.object({
  type: z.enum(actionTypes),
  params: z.any(),
});

export type ActionItem = z.infer<typeof actionItem>;

export const promptActionItem = actionItem.extend({
  text: localeTranslation,
  label: localeTranslation,
  color: z.string().nullable(),
  variant: z.enum(variants),
  icon: z.string().nullable(),
  layout: z.enum(layoutTypes).array(),
});

export type PromptActionItem = z.infer<typeof promptActionItem>;

export const promptActions = z.object({
  both: z.boolean(),
  items: promptActionItem.array(),
});

export type PromptActions = z.infer<typeof promptActions>;

export const defaultAction: PromptActionItem = {
  type: 'next',
  text: { en: '' },
  label: {},
  color: 'primary',
  variant: 'text',
  icon: '$next',
  layout: ['desktop', 'mobile'],
  params: {},
};
