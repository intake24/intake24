import { z } from 'zod';

import { condition } from '@intake24/common/prompts';

import { localeOptionList, requiredLocaleTranslation } from '../../common';
import { synonymSetAttributes } from './locales';

export const foodBuilderStepBase = z.object({
  id: z.string(),
  name: requiredLocaleTranslation,
  description: requiredLocaleTranslation,
});

export const coefficientStep = foodBuilderStepBase.extend({
  type: z.literal('coefficient'),
  options: localeOptionList({ valueSchema: z.coerce.number().nonnegative() }),
});
export type CoefficientStep = z.infer<typeof coefficientStep>;

export const conditionStep = foodBuilderStepBase.extend({
  type: z.literal('condition'),
  options: localeOptionList({ valueSchema: condition.array() }),
});
export type ConditionStep = z.infer<typeof conditionStep>;

export const ingredientStep = foodBuilderStepBase.extend({
  type: z.literal('ingredient'),
  categoryCode: z.string().min(1).max(64),
  multiple: z.boolean(),
  required: z.boolean(),
});
export type IngredientStep = z.infer<typeof ingredientStep>;

export const resources = ['categories', 'foods'] as const;
export type Resource = typeof resources[number];

export const lookupStep = foodBuilderStepBase.extend({
  type: z.literal('lookup'),
  resource: z.enum(resources),
  options: localeOptionList({ valueSchema: z.string().min(1).max(64) }),
});
export type LookupStep = z.infer<typeof lookupStep>;

export const foodBuilderStep = z.discriminatedUnion('type', [
  coefficientStep,
  conditionStep,
  ingredientStep,
  lookupStep,
]);
export type FoodBuilderStep = z.infer<typeof foodBuilderStep>;
export type GetFoodBuilderStep<U extends FoodBuilderStepType> = Extract<FoodBuilderStep, { type: U }>;

export const foodStepTypes = ['coefficient', 'condition', 'ingredient', 'lookup'] as const;
export type FoodBuilderStepType = typeof foodStepTypes[number];

export const foodBuilderTypes = ['generic', 'recipe'] as const;
export type FoodBuilderType = typeof foodBuilderTypes[number];

export const foodBuilderAttributes = z.object({
  id: z.string(),
  localeId: z.string().min(1).max(64),
  code: z.string().min(1).max(64),
  type: z.enum(foodBuilderTypes),
  name: z.string().min(1).max(256),
  triggerWord: z.string().max(512),
  synonymSetId: z.string().nullable(),
  steps: foodBuilderStep.array(),
});
export type FoodBuilderAttributes = z.infer<typeof foodBuilderAttributes>;

export const foodBuilderRequest = foodBuilderAttributes.partial({ id: true });
export type FoodBuilderRequest = z.infer<typeof foodBuilderRequest>;

export const foodBuilderEntry = foodBuilderAttributes.extend({
  steps: foodBuilderStep.array(),
  synonymSet: synonymSetAttributes,
});
export type FoodBuilderEntry = z.infer<typeof foodBuilderEntry>;
