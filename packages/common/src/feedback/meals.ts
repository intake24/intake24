import { z } from 'zod';

import { colors } from '../theme';
import { requiredLocaleTranslation } from '../types/common';
import { nutrient } from './shared';

export const feedbackMealChart = z.object({
  colors: z.array(z.string()),
  nutrients: nutrient.array(),
});

export type FeedbackMealChart = z.infer<typeof feedbackMealChart>;

export const mealTableFieldTypes = ['standard', 'custom', 'nutrient'] as const;
export type MealTableFieldType = (typeof mealTableFieldTypes)[number];
export const mealTableFieldStandardIds = ['name', 'hours', 'minutes', 'time', 'duration'] as const;
export type MealTableFieldId = (typeof mealTableFieldStandardIds)[number];

export const baseMealTableField = z.object({
  header: requiredLocaleTranslation,
  value: requiredLocaleTranslation,
});

export type BaseMealTableField = z.infer<typeof baseMealTableField>;

export const standardMealTableField = baseMealTableField.extend({
  type: z.literal('standard'),
  fieldId: z.enum(['name', 'hours', 'minutes', 'time', 'duration']),
});

export const customMealTableField = baseMealTableField.extend({
  type: z.literal('custom'),
  fieldId: z.string(),
});

export const nutrientMealTableField = baseMealTableField.extend({
  type: z.literal('nutrient'),
  fieldId: z.string(),
  types: z.array(z.string()),
});

export const mealTableField = z.discriminatedUnion('type', [
  standardMealTableField,
  customMealTableField,
  nutrientMealTableField,
]);

export type MealTableField = z.infer<typeof mealTableField>;

export const feedbackMealTable = z.object({
  fields: z.array(mealTableField),
});

export type FeedbackMealTable = z.infer<typeof feedbackMealTable>;

export const feedbackMeals = z.object({
  chart: feedbackMealChart,
  table: feedbackMealTable,
});

export type FeedbackMeals = z.infer<typeof feedbackMeals>;

export const defaultMeals: FeedbackMeals = {
  chart: {
    colors: Object.values(colors).slice(0, 5),
    nutrients: [{ id: ['1'], name: { en: 'Energy (kcal)' } }],
  },
  table: {
    fields: [
      {
        type: 'standard',
        fieldId: 'name',
        header: { en: 'Meal' },
        value: { en: '{value}' },
      },
      {
        type: 'standard',
        fieldId: 'time',
        header: { en: 'Time' },
        value: { en: '{value}' },
      },
      {
        type: 'standard',
        fieldId: 'duration',
        header: { en: 'Duration (min)' },
        value: { en: '{value} min' },
      },
      {
        type: 'nutrient',
        fieldId: 'nutrient-1',
        header: { en: 'Energy (kcal)' },
        value: { en: '{value}' },
        types: ['1'],
      },
      {
        type: 'custom',
        fieldId: 'ask-about-food-source',
        header: { en: 'Eating context' },
        value: { en: '{value}' },
      },
    ],
  },
};
