import { z } from 'zod';
import { portionSizeMethods } from '@intake24/common/surveys';

export const customField = z.object({
  id: z.string().uuid(),
  name: z.string().max(64),
  value: z.string().max(2048),
});

// Foods
export const surveySubmissionFoodCustomField = customField.extend({
  foodId: z.string().uuid(),
});
export type SurveySubmissionFoodCustomField = z.infer<typeof surveySubmissionFoodCustomField>;

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

export const surveySubmissionFields = z.object({
  id: z.string().uuid(),
  foodId: z.string().uuid(),
  fieldName: z.string().max(64),
  value: z.string().max(512),
});
export type SurveySubmissionField = z.infer<typeof surveySubmissionFields>;

export const surveySubmissionNutrient = z.object({
  id: z.string().uuid(),
  foodId: z.string().uuid(),
  nutrientTypeId: z.string(),
  amount: z.number(),
});
export type SurveySubmissionNutrient = z.infer<typeof surveySubmissionNutrient>;

export const surveySubmissionPortionSize = z.object({
  id: z.string().uuid(),
  foodId: z.string().uuid(),
  name: z.string().max(64),
  value: z.string().max(512),
});
export type SurveySubmissionPortionSize = z.infer<typeof surveySubmissionPortionSize>;

// Meals
export const surveySubmissionMealCustomField = customField.extend({
  mealId: z.string().uuid(),
});
export type SurveySubmissionMealCustomField = z.infer<typeof surveySubmissionMealCustomField>;

// Submissions
export const surveySubmissionMeal = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  hours: z.number().int(),
  minutes: z.number().int(),
  name: z.string().max(64).nullable(),
  duration: z.number().int().nullable(),
});
export type SurveySubmissionMeal = z.infer<typeof surveySubmissionMeal>;

export const surveySubmissionCustomField = customField.extend({
  submissionId: z.string().uuid(),
});
export type SurveySubmissionCustomField = z.infer<typeof surveySubmissionCustomField>;

export const surveySubmissionAttributes = z.object({
  id: z.string().uuid(),
  surveyId: z.string(),
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  submissionTime: z.date(),
  log: z.string().nullable(),
  sessionId: z.string().uuid(),
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
  customFields: surveySubmissionCustomField.array(),
  meals: surveySubmissionMeal.extend({
    customFields: surveySubmissionMealCustomField.array(),
    foods: surveySubmissionFood.extend({
      customFields: surveySubmissionFoodCustomField.array(),
      fields: surveySubmissionFields.array(),
      nutrients: surveySubmissionNutrient.array(),
      portionSizes: surveySubmissionPortionSize.array(),
    }).array(),
    missingFoods: surveySubmissionMissingFood.array(),
  }).array(),
});
export type SurveySubmissionEntry = z.infer<typeof surveySubmissionEntry>;
