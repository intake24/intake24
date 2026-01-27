import { z } from 'zod';

import {
  weightTargetCoefficients,
} from '../../feedback';
import {
  feedbackSchemeAttributes,
  physicalActivityLevelAttributes,
  surveySubmissionEntry,
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

export const feedbackSubmissionEntry = surveySubmissionEntry;
export type FeedbackSubmissionEntry = z.infer<typeof feedbackSubmissionEntry>;
