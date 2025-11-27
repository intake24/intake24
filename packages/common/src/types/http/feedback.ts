import { z } from 'zod';
import {
  weightTargetCoefficients,
} from '../../feedback';
import {
  feedbackSchemeAttributes,
  physicalActivityLevelAttributes,
  surveySubmissionAttributes,
  surveySubmissionCustomField,
  surveySubmissionFields,
  surveySubmissionFood,
  surveySubmissionFoodCustomField,
  surveySubmissionMeal,
  surveySubmissionMealCustomField,
  surveySubmissionMissingFood,
  surveySubmissionNutrient,
  surveySubmissionPortionSize,
} from './admin';

export const feedbackSchemeResponse = feedbackSchemeAttributes.pick({
  id: true,
  cards: true,
  demographicGroups: true,
  henryCoefficients: true,
  meals: true,
  outputs: true,
  physicalDataFields: true,
  sections: true,
  topFoods: true,
  type: true,
});

export type FeedbackSchemeResponse = z.infer<typeof feedbackSchemeResponse>;

export const nutrientType = z.object({
  id: z.string(),
  description: z.string(),
  unit: z.string(),
  kcalPerUnit: z.number().nullable(),
});

export type NutrientType = z.infer<typeof nutrientType>;

export const feedbackDataResponse = z.object({
  nutrientTypes: nutrientType.array(),
  physicalActivityLevels: physicalActivityLevelAttributes.array(),
  weightTargets: weightTargetCoefficients.array(),
});

export type FeedbackDataResponse = z.infer<typeof feedbackDataResponse>;

export const feedbackSubmissionEntry = surveySubmissionAttributes.extend({
  customFields: surveySubmissionCustomField.pick({ name: true, value: true }).array(),
  meals: surveySubmissionMeal.extend({
    customFields: surveySubmissionMealCustomField.pick({ name: true, value: true }).array(),
    foods: surveySubmissionFood.extend({
      customFields: surveySubmissionFoodCustomField.pick({ name: true, value: true }).array(),
      fields: surveySubmissionFields.pick({ fieldName: true, value: true }).array(),
      nutrients: surveySubmissionNutrient.pick({ amount: true, nutrientTypeId: true }).array(),
      portionSizes: surveySubmissionPortionSize.pick({ name: true, value: true }).array(),
    }).array(),
    missingFoods: surveySubmissionMissingFood.array(),
  }).array(),
});
export type FeedbackSubmissionEntry = z.infer<typeof feedbackSubmissionEntry>;
