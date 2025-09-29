import type { PortionSizeMethodId } from '../../surveys';

import { z } from 'zod';
import { localeOptionList, localeTranslation } from '../../types';
import { actions } from '../actions';
import { layoutTypes } from '../partials';
import { condition } from './conditions';

export const radioOrientations = ['column', 'row'] as const;
export type RadioOrientation = (typeof radioOrientations)[number];

export const promptTypes = ['custom', 'standard', 'portion-size'] as const;
export type PromptType = (typeof promptTypes)[number];

export const customComponentTypes = [
  'info-prompt',
  'date-picker-prompt',
  'time-picker-prompt',
  'checkbox-list-prompt',
  'multi-prompt',
  'no-more-information-prompt',
  'radio-list-prompt',
  'select-prompt',
  'slider-prompt',
  'textarea-prompt',
  'yes-no-prompt',
] as const;

export type CustomComponentType = (typeof customComponentTypes)[number];

export const standardComponentTypes = [
  'associated-foods-prompt',
  'edit-meal-prompt',
  'final-prompt',
  'food-search-prompt',
  'meal-add-prompt',
  'meal-gap-prompt',
  'meal-duration-prompt',
  'meal-time-prompt',
  'ready-meal-prompt',
  'redirect-prompt',
  'review-confirm-prompt',
  'same-as-before-prompt',
  'split-food-prompt',
  'submit-prompt',
] as const;

export type StandardComponentType = (typeof standardComponentTypes)[number];

export type PortionSizeComponentType =
  | `${PortionSizeMethodId}-prompt`
  | 'missing-food-prompt'
  | 'portion-size-option-prompt';

/* export const portionSizeComponentTypes = [
  ...portionSizeMethods,
  'missing-food',
  'portion-size-option',
].map(type => `${type}-prompt`) as PortionSizeComponentType[]; */

export const portionSizeComponentTypes = [
  'as-served-prompt',
  'cereal-prompt',
  'direct-weight-prompt',
  'drink-scale-prompt',
  'guide-image-prompt',
  'milk-in-a-hot-drink-prompt',
  'milk-on-cereal-prompt',
  'parent-food-portion-prompt',
  'pizza-prompt',
  'pizza-v2-prompt',
  'recipe-builder-prompt',
  'standard-portion-prompt',
  'missing-food-prompt',
  'portion-size-option-prompt',
] as const;

export type ComponentType = CustomComponentType | StandardComponentType | PortionSizeComponentType;

export const promptValidation = z.object({
  required: z.boolean(),
  message: localeTranslation,
});
export type PromptValidation = z.infer<typeof promptValidation>;

export const promptValidationWithLimits = promptValidation.extend({
  min: z.coerce.number().int().nonnegative().nullish(),
  max: z.coerce.number().int().nonnegative().nullish(),
})
  .refine((data) => {
    if (typeof data.max !== 'number' || typeof data.min !== 'number')
      return true;

    return data.max >= data.min;
  }, { path: ['validation.max'] });
export type PromptValidationWithLimits = z.infer<typeof promptValidationWithLimits>;

export const basePrompt = z.object({
  id: z.string(),
  name: z.string(),
  i18n: z.record(localeTranslation),
  actions: actions.optional(),
  conditions: condition.array(),
});

export type BasePrompt = z.infer<typeof basePrompt>;

export const validatedPrompt = basePrompt.extend({ validation: promptValidation });
export type ValidatedPrompt = z.infer<typeof validatedPrompt>;

export const baseCustomPrompt = basePrompt.extend({ type: z.literal('custom'), group: z.string().nullish() });
export type BaseCustomPrompt = z.infer<typeof baseCustomPrompt>;
export const basePortionPrompt = basePrompt.extend({ type: z.literal('portion-size'), badges: z.boolean() });
export type BasePortionPrompt = z.infer<typeof basePortionPrompt>;
export const baseStandardPrompt = basePrompt.extend({ type: z.literal('standard') });
export type BaseStandardPrompt = z.infer<typeof baseStandardPrompt>;

export const foodBrowser = z.object({
  categoriesFirst: z.record(z.enum(['browse', 'search']), z.boolean()),
});
export type FoodBrowser = z.infer<typeof foodBrowser>;

export const imageMap = z.object({
  labels: z.boolean(),
  pinchZoom: z.boolean(),
});
export type ImageMap = z.infer<typeof imageMap>;

export const linkedQuantityCategory = z.object({
  code: z.string(),
  unit: z.string().optional(),
});
export type LinkedQuantityCategory = z.infer<typeof linkedQuantityCategory>;

export const linkedQuantity = z.object({
  auto: z.boolean(),
  parent: linkedQuantityCategory.array(),
  source: z.string().array(),
});
export type LinkedQuantity = z.infer<typeof linkedQuantity>;

export const reviewOptions = [false, 'scroll', 'checkbox', 'onecheckbox'] as const;
export type ReviewOptions = (typeof reviewOptions)[number];

export const sliderValue = z.object({
  value: z.number().nullable(),
  label: z.union([z.literal(false), localeTranslation]),
});
export type SliderValue = z.infer<typeof sliderValue>;

export const slider = z.object({
  current: sliderValue.extend({ size: z.number() }),
  min: sliderValue,
  max: sliderValue,
  step: z.number(),
});
export type Slider = z.infer<typeof slider>;

export const timePicker = z.object({
  format: z.enum(['ampm', '24hr']),
  allowedMinutes: z.union([z.literal(1), z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
});
export type TimePicker = z.infer<typeof timePicker>;

// Custom
const checkboxListPrompt = baseCustomPrompt
  .extend({
    component: z.literal('checkbox-list-prompt'),
    options: localeOptionList(),
    other: z.boolean(),
    validation: promptValidationWithLimits,
  });

const datePickerPrompt = baseCustomPrompt.merge(validatedPrompt).extend({
  component: z.literal('date-picker-prompt'),
  futureDates: z.boolean(),
});

const infoPrompt = baseCustomPrompt.extend({
  component: z.literal('info-prompt'),
});

const noMoreInformationPrompt = baseCustomPrompt.extend({
  component: z.literal('no-more-information-prompt'),
});

const radioListPrompt = baseCustomPrompt.merge(validatedPrompt).extend({
  component: z.literal('radio-list-prompt'),
  options: localeOptionList(),
  orientation: z.enum(radioOrientations),
  other: z.boolean(),
});

const selectPrompt = baseCustomPrompt.merge(validatedPrompt).extend({
  component: z.literal('select-prompt'),
  options: localeOptionList(),
  multiple: z.boolean(),
});

const sliderPrompt = baseCustomPrompt.extend({
  component: z.literal('slider-prompt'),
  slider,
});

const textareaPrompt = baseCustomPrompt.merge(validatedPrompt).extend({
  component: z.literal('textarea-prompt'),
});

const timePickerPrompt = baseCustomPrompt.merge(validatedPrompt).merge(timePicker).extend({
  component: z.literal('time-picker-prompt'),
});

const yesNoPrompt = baseCustomPrompt.extend({
  component: z.literal('yes-no-prompt'),
});

// Portion size
const asServedPrompt = basePortionPrompt.extend({
  component: z.literal('as-served-prompt'),
  imageMap,
  leftovers: z.boolean(),
});

const cerealPrompt = basePortionPrompt.extend({
  component: z.literal('cereal-prompt'),
  imageMap,
  leftovers: z.boolean(),
});

const directWeightPrompt = basePortionPrompt.extend({
  component: z.literal('direct-weight-prompt'),
});

const drinkScalePrompt = basePortionPrompt.extend({
  component: z.literal('drink-scale-prompt'),
  imageMap,
  leftovers: z.boolean(),
  multiple: z.union([z.literal(false), slider]),
});

const guideImagePrompt = basePortionPrompt.extend({
  component: z.literal('guide-image-prompt'),
  imageMap,
  linkedQuantity,
});

const milkInAHotDrinkPrompt = basePortionPrompt.extend({
  component: z.literal('milk-in-a-hot-drink-prompt'),
  orientation: z.enum(radioOrientations),
});

const milkOnCerealPrompt = basePortionPrompt.extend({
  component: z.literal('milk-on-cereal-prompt'),
  imageMap,
});

const missingFoodPrompt = basePortionPrompt.extend({
  component: z.literal('missing-food-prompt'),
});

const parentFoodPortionPrompt = basePortionPrompt.extend({
  component: z.literal('parent-food-portion-prompt'),
  orientation: z.enum(radioOrientations),
});

const pizzaPrompt = basePortionPrompt.extend({
  component: z.literal('pizza-prompt'),
  imageMap,
});

const pizzaV2Prompt = basePortionPrompt.extend({
  component: z.literal('pizza-v2-prompt'),
  imageMap,
});

const portionSizeOptionPrompt = basePortionPrompt.extend({
  component: z.literal('portion-size-option-prompt'),
});

const recipeBuilderPrompt = basePortionPrompt.merge(foodBrowser).extend({
  component: z.literal('recipe-builder-prompt'),
});

const standardPortionPrompt = basePortionPrompt.extend({
  component: z.literal('standard-portion-prompt'),
});

// Standard
const associatedFoodsPrompt = baseStandardPrompt.merge(foodBrowser).extend({
  component: z.literal('associated-foods-prompt'),
  multiple: z.boolean(),
  skipFollowUpPrompts: z.boolean().default(false),
});

const editMealPrompt = baseStandardPrompt.extend({
  component: z.literal('edit-meal-prompt'),
  separateDrinks: z.boolean(),
});

const finalPrompt = baseStandardPrompt.extend({
  component: z.literal('final-prompt'),
  rating: z.boolean(),
});

const foodSearchPrompt = baseStandardPrompt.merge(foodBrowser).extend({
  component: z.literal('food-search-prompt'),
  allowBrowsing: z.boolean(),
  dualLanguage: z.boolean(),
});

const mealAddPrompt = baseStandardPrompt.extend({
  component: z.literal('meal-add-prompt'),
  custom: z.boolean(),
  unique: z.boolean(),
});

const mealDurationPrompt = baseStandardPrompt.extend({
  component: z.literal('meal-duration-prompt'),
  slider,
});

const mealGapPrompt = baseStandardPrompt.extend({
  component: z.literal('meal-gap-prompt'),
  gap: z.number(),
  startTime: z.string(),
  endTime: z.string(),
});

const mealTimePrompt = baseStandardPrompt.merge(timePicker).extend({
  component: z.literal('meal-time-prompt'),
});

const readyMealPrompt = baseStandardPrompt.extend({
  component: z.literal('ready-meal-prompt'),
});

const redirectPrompt = baseStandardPrompt.extend({
  component: z.literal('redirect-prompt'),
  rating: z.boolean(),
  url: z.string().nullable(),
  identifier: z.union([z.literal('userId'), z.literal('username'), z.literal('urlAuthToken'), z.string(), z.null()]),
  timer: z.number(),
  target: z.union([z.literal('_self'), z.literal('_blank')]),
});

const reviewConfirmPrompt = baseStandardPrompt.extend({
  component: z.literal('review-confirm-prompt'),
});

const sameAsBeforePrompt = baseStandardPrompt.extend({
  component: z.literal('same-as-before-prompt'),
});

const splitFoodPrompt = baseStandardPrompt.extend({
  component: z.literal('split-food-prompt'),
});

const submitPrompt = baseStandardPrompt.extend({
  component: z.literal('submit-prompt'),
  review: z.record(z.enum(layoutTypes), z.union([z.literal(false), z.literal('scroll'), z.literal('checkbox'), z.literal('onecheckbox')])),
});

export const singlePrompt = z.discriminatedUnion('component', [
  // Custom
  checkboxListPrompt,
  datePickerPrompt,
  infoPrompt,
  noMoreInformationPrompt,
  radioListPrompt,
  selectPrompt,
  sliderPrompt,
  textareaPrompt,
  timePickerPrompt,
  yesNoPrompt,
  // Portion size
  asServedPrompt,
  cerealPrompt,
  directWeightPrompt,
  drinkScalePrompt,
  guideImagePrompt,
  milkInAHotDrinkPrompt,
  milkOnCerealPrompt,
  missingFoodPrompt,
  parentFoodPortionPrompt,
  pizzaPrompt,
  pizzaV2Prompt,
  portionSizeOptionPrompt,
  recipeBuilderPrompt,
  standardPortionPrompt,
  // Standard
  associatedFoodsPrompt,
  editMealPrompt,
  finalPrompt,
  foodSearchPrompt,
  mealAddPrompt,
  mealDurationPrompt,
  mealGapPrompt,
  mealTimePrompt,
  readyMealPrompt,
  redirectPrompt,
  reviewConfirmPrompt,
  sameAsBeforePrompt,
  splitFoodPrompt,
  submitPrompt,
]);
export type SinglePrompt = z.infer<typeof singlePrompt>;

const multiPrompt = baseCustomPrompt.extend({
  component: z.literal('multi-prompt'),
  prompts: singlePrompt.array(),
});

export const prompt = singlePrompt.or(multiPrompt);
export type Prompt = z.infer<typeof prompt>;

export const prompts = z.object({
  // Custom
  'checkbox-list-prompt': checkboxListPrompt,
  'date-picker-prompt': datePickerPrompt,
  'info-prompt': infoPrompt,
  'multi-prompt': multiPrompt,
  'no-more-information-prompt': noMoreInformationPrompt,
  'radio-list-prompt': radioListPrompt,
  'select-prompt': selectPrompt,
  'slider-prompt': sliderPrompt,
  'textarea-prompt': textareaPrompt,
  'time-picker-prompt': timePickerPrompt,
  'yes-no-prompt': yesNoPrompt,
  // Portion size
  'as-served-prompt': asServedPrompt,
  'cereal-prompt': cerealPrompt,
  'direct-weight-prompt': directWeightPrompt,
  'drink-scale-prompt': drinkScalePrompt,
  'guide-image-prompt': guideImagePrompt,
  'milk-in-a-hot-drink-prompt': milkInAHotDrinkPrompt,
  'milk-on-cereal-prompt': milkOnCerealPrompt,
  'missing-food-prompt': missingFoodPrompt,
  'parent-food-portion-prompt': parentFoodPortionPrompt,
  'pizza-prompt': pizzaPrompt,
  'pizza-v2-prompt': pizzaV2Prompt,
  'portion-size-option-prompt': portionSizeOptionPrompt,
  'recipe-builder-prompt': recipeBuilderPrompt,
  'standard-portion-prompt': standardPortionPrompt,
  // Standard
  'associated-foods-prompt': associatedFoodsPrompt,
  'edit-meal-prompt': editMealPrompt,
  'final-prompt': finalPrompt,
  'food-search-prompt': foodSearchPrompt,
  'meal-add-prompt': mealAddPrompt,
  'meal-duration-prompt': mealDurationPrompt,
  'meal-gap-prompt': mealGapPrompt,
  'meal-time-prompt': mealTimePrompt,
  'ready-meal-prompt': readyMealPrompt,
  'redirect-prompt': redirectPrompt,
  'review-confirm-prompt': reviewConfirmPrompt,
  'same-as-before-prompt': sameAsBeforePrompt,
  'split-food-prompt': splitFoodPrompt,
  'submit-prompt': submitPrompt,
});

export type Prompts = z.infer<typeof prompts>;
