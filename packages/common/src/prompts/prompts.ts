import type { PortionSizeMethodId } from '../surveys';
import { z } from 'zod';
import { barcodeScannerOptions } from '../barcodes';
import { localeOptionList, localeTranslation } from '../types/common';
import { actions } from './actions';
import { condition } from './conditions';
import { externalSourceOptions } from './external-sources';
import { carousel, counter, datePicker, hasVideo, layoutTypes, slider, timePicker } from './partials';

export const radioOrientations = ['column', 'row'] as const;
export type RadioOrientation = (typeof radioOrientations)[number];

export const promptTypes = ['custom', 'standard', 'portion-size'] as const;
export type PromptType = (typeof promptTypes)[number];

export const customComponentTypes = [
  'aggregate-choice-prompt',
  'info-prompt',
  'date-picker-prompt',
  'food-selection-prompt',
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
  'addon-foods-prompt',
  'associated-foods-prompt',
  'general-associated-foods-prompt',
  'edit-meal-prompt',
  'external-source-prompt',
  'final-prompt',
  'food-search-prompt',
  'meal-add-prompt',
  'meal-gap-prompt',
  'meal-duration-prompt',
  'meal-time-prompt',
  'ready-meal-prompt',
  'recall-date-prompt',
  'redirect-prompt',
  'review-confirm-prompt',
  'same-as-before-prompt',
  'sleep-schedule-prompt',
  'split-food-prompt',
  'submit-prompt',
] as const;
export type StandardComponentType = (typeof standardComponentTypes)[number];

export type PortionSizeComponentType
  = | `${PortionSizeMethodId}-prompt`
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
  'unknown-prompt',
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

export const CurrentPromptVersion = 4;

export const basePrompt = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  version: z.number(),
  i18n: z.record(localeTranslation),
  actions: actions.optional(),
  conditions: condition.array(),
  useGraph: z.boolean(),
  graph: z.any().optional(),
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

const addonFood = z.object({
  id: z.string().min(1),
  name: localeTranslation,
  entity: z.enum(['category', 'food']),
  code: z.string(),
  filter: condition.array(),
});
export type AddonFood = z.infer<typeof addonFood>;

const foodSearchHint = z.object({
  keyword: z.string().min(1).array(),
  text: localeTranslation,
});
export type FoodSearchHint = z.infer<typeof foodSearchHint>;

export const foodBrowser = z.object({
  categoriesFirst: z.record(z.enum(['browse', 'search']), z.boolean()),
  allowThumbnails: z.boolean(),
  enableGrid: z.boolean(),
  gridThreshold: z.number(),
});
export type FoodBrowser = z.infer<typeof foodBrowser>;

export const imageMap = z.object({
  labels: z.boolean().nullable(),
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

// Custom
const aggregateChoicePrompt = baseCustomPrompt.extend({
  component: z.literal('aggregate-choice-prompt'),
  options: localeOptionList(),
  foodFilter: condition.optional(),
});

const checkboxListPrompt = baseCustomPrompt
  .extend({
    component: z.literal('checkbox-list-prompt'),
    options: localeOptionList({ limit: 2048 }),
    other: z.boolean(),
    validation: promptValidationWithLimits,
  });

const datePickerPrompt = baseCustomPrompt.merge(validatedPrompt).merge(datePicker).extend({
  component: z.literal('date-picker-prompt'),
});

const foodSelectionPrompt = baseCustomPrompt.extend({
  component: z.literal('food-selection-prompt'),
  foodFilter: condition.optional(),
  useFlag: z.boolean(),
  flag: z.string().optional(),
});

const infoPrompt = baseCustomPrompt.merge(hasVideo).extend({
  component: z.literal('info-prompt'),
  carousel: carousel.optional(),
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
  options: localeOptionList({ limit: 2048 }),
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
  useFlag: z.boolean(),
  flag: z.string().optional(),
});

// Portion size
export const hasMultiple = z.object({ multiple: z.discriminatedUnion('type', [counter, slider]).or(z.literal(false)) });
export type HasMultiple = z.infer<typeof hasMultiple>;

const asServedPrompt = basePortionPrompt
  .merge(hasMultiple)
  .extend({
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

const drinkScalePrompt = basePortionPrompt
  .merge(hasMultiple)
  .extend({
    component: z.literal('drink-scale-prompt'),
    imageMap,
    leftovers: z.boolean(),
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
  barcode: barcodeScannerOptions,
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
  hints: foodSearchHint.array(),
});

const standardPortionPrompt = basePortionPrompt.extend({
  component: z.literal('standard-portion-prompt'),
});

const unknownPrompt = basePortionPrompt.extend({
  component: z.literal('unknown-prompt'),
  defaultWeight: z.number().optional(),
});

// Standard
const addonFoodsPrompt = baseStandardPrompt.extend({
  component: z.literal('addon-foods-prompt'),
  addons: addonFood.array(),
});

const associatedFoodsPrompt = baseStandardPrompt.merge(foodBrowser).extend({
  component: z.literal('associated-foods-prompt'),
  hints: foodSearchHint.array(),
  multiple: z.boolean(),
});

const generalAssociatedFoodsPrompt = baseStandardPrompt.merge(foodBrowser).extend({
  component: z.literal('general-associated-foods-prompt'),
  categoryCode: z.string(),
  promptText: localeTranslation,
  genericName: localeTranslation,
  hints: foodSearchHint.array(),
  multiple: z.boolean(),
  skipPortionSize: z.boolean(),
});

const editMealPrompt = baseStandardPrompt.extend({
  component: z.literal('edit-meal-prompt'),
  separateDrinks: z.boolean(),
  inputAutoFocus: z.boolean(),
  hints: foodSearchHint.array(),
});

const externalSourcePrompt = baseStandardPrompt.extend({
  component: z.literal('external-source-prompt'),
  source: externalSourceOptions,
  barcode: barcodeScannerOptions,
});

const finalPrompt = baseStandardPrompt.extend({
  component: z.literal('final-prompt'),
  rating: z.boolean(),
});

const foodSearchPrompt = baseStandardPrompt.merge(foodBrowser).extend({
  component: z.literal('food-search-prompt'),
  allowBrowsing: z.boolean(),
  dualLanguage: z.boolean(),
  hints: foodSearchHint.array(),
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

const recallDatePrompt = baseStandardPrompt.merge(datePicker).extend({
  component: z.literal('recall-date-prompt'),
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
  skipToSAB: z.boolean().optional(),
});

const sleepSchedulePrompt = baseStandardPrompt.merge(timePicker).extend({
  component: z.literal('sleep-schedule-prompt'),
  wakeUpTime: z.string().time(),
  sleepTime: z.string().time(),
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
  aggregateChoicePrompt,
  checkboxListPrompt,
  datePickerPrompt,
  infoPrompt,
  foodSelectionPrompt,
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
  unknownPrompt,
  // Standard
  addonFoodsPrompt,
  associatedFoodsPrompt,
  generalAssociatedFoodsPrompt,
  editMealPrompt,
  externalSourcePrompt,
  finalPrompt,
  foodSearchPrompt,
  mealAddPrompt,
  mealDurationPrompt,
  mealGapPrompt,
  mealTimePrompt,
  readyMealPrompt,
  recallDatePrompt,
  redirectPrompt,
  reviewConfirmPrompt,
  sameAsBeforePrompt,
  sleepSchedulePrompt,
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
  'aggregate-choice-prompt': aggregateChoicePrompt,
  'checkbox-list-prompt': checkboxListPrompt,
  'date-picker-prompt': datePickerPrompt,
  'info-prompt': infoPrompt,
  'food-selection-prompt': foodSelectionPrompt,
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
  'unknown-prompt': unknownPrompt,
  // Standard
  'addon-foods-prompt': addonFoodsPrompt,
  'associated-foods-prompt': associatedFoodsPrompt,
  'general-associated-foods-prompt': generalAssociatedFoodsPrompt,
  'edit-meal-prompt': editMealPrompt,
  'external-source-prompt': externalSourcePrompt,
  'final-prompt': finalPrompt,
  'food-search-prompt': foodSearchPrompt,
  'meal-add-prompt': mealAddPrompt,
  'meal-duration-prompt': mealDurationPrompt,
  'meal-gap-prompt': mealGapPrompt,
  'meal-time-prompt': mealTimePrompt,
  'ready-meal-prompt': readyMealPrompt,
  'recall-date-prompt': recallDatePrompt,
  'redirect-prompt': redirectPrompt,
  'review-confirm-prompt': reviewConfirmPrompt,
  'same-as-before-prompt': sameAsBeforePrompt,
  'sleep-schedule-prompt': sleepSchedulePrompt,
  'split-food-prompt': splitFoodPrompt,
  'submit-prompt': submitPrompt,
});

export type Prompts = z.infer<typeof prompts>;
