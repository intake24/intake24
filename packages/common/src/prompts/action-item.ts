import { z } from 'zod';

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
