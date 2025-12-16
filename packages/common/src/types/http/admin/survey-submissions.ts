import { z } from 'zod';
import { customData, portionSizeMethods } from '@intake24/common/surveys';

// Foods
export const surveySubmissionFood = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  mealId: z.string().uuid(),
  index: z.number().int(),
  code: z.string().max(64),
  englishName: z.string().max(256),
  localName: z.string().max(256).nullable(),
  locale: z.string().max(64),
  readyMeal: z.boolean(),
  searchTerm: z.string().max(256),
  portionSizeId: z.enum(portionSizeMethods),
  reasonableAmount: z.boolean(),
  brand: z.string().max(128).nullable(),
  nutrientTableId: z.string().max(64),
  nutrientTableCode: z.string().max(64),
  barcode: z.string().max(128).nullable(),
  customData,
  fields: z.record(z.string(), z.string()),
  nutrients: z.record(z.string(), z.number()),
  portionSize: z.record(z.string(), z.string()),
});
export type SurveySubmissionFood = z.infer<typeof surveySubmissionFood>;

export const surveySubmissionMissingFood = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  mealId: z.string().uuid(),
  index: z.number().int(),
  name: z.string().max(512).nullable(),
  brand: z.string().max(512).nullable(),
  description: z.string().max(1024).nullable(),
  portionSize: z.string().max(1024).nullable(),
  leftovers: z.string().max(1024).nullable(),
  barcode: z.string().max(128).nullable(),
});
export type SurveySubmissionMissingFood = z.infer<typeof surveySubmissionMissingFood>;

// Meals
export const surveySubmissionMeal = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  hours: z.number().int(),
  minutes: z.number().int(),
  name: z.string().max(64).nullable(),
  duration: z.number().int().nullable(),
  customData,
});
export type SurveySubmissionMeal = z.infer<typeof surveySubmissionMeal>;

// Submissions
export const surveySubmissionAttributes = z.object({
  id: z.string().uuid(),
  surveyId: z.string(),
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  submissionTime: z.date(),
  log: z.string().nullable(),
  sessionId: z.string().uuid(),
  customData,
  userAgent: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SurveySubmissionAttributes = z.infer<typeof surveySubmissionAttributes>;

export const surveySubmissionListEntry = surveySubmissionAttributes.extend({
  username: z.string(),
});
export type SurveySubmissionListEntry = z.infer<typeof surveySubmissionEntry>;

export const surveySubmissionEntry = surveySubmissionAttributes.extend({
  meals: surveySubmissionMeal.extend({
    foods: surveySubmissionFood.array(),
    missingFoods: surveySubmissionMissingFood.array(),
  }).array(),
});
export type SurveySubmissionEntry = z.infer<typeof surveySubmissionEntry>;
