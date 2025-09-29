import type { FoodBrowser, Prompts } from './prompts';

import { copy } from '@intake24/common/util';
import { basePrompt } from './base';

export const foodBrowserDefaults: FoodBrowser = {
  categoriesFirst: { browse: false, search: false },
  allowThumbnails: false,
  enableGrid: false,
  gridThreshold: 70,
};

export const addonFoodsPrompt: Prompts['addon-foods-prompt'] = copy({
  ...basePrompt,
  component: 'addon-foods-prompt',
  type: 'standard',
  id: 'addon-foods-prompt',
  name: 'Addon foods prompt',
  addons: [],
});

export const associatedFoodsPrompt: Prompts['associated-foods-prompt'] = copy({
  ...basePrompt,
  component: 'associated-foods-prompt',
  type: 'standard',
  id: 'associated-foods-prompt',
  name: 'Associated foods prompt',
  multiple: false,
  skipFollowUpPrompts: false,
  ...foodBrowserDefaults,
});

export const editMealPrompt: Prompts['edit-meal-prompt'] = copy({
  ...basePrompt,
  component: 'edit-meal-prompt',
  type: 'standard',
  id: 'edit-meal-prompt',
  name: 'Meal Edit prompt',
  separateDrinks: false,
  inputAutoFocus: true,
});

export const externalSourcePrompt: Prompts['external-source-prompt'] = copy({
  ...basePrompt,
  component: 'external-source-prompt',
  type: 'standard',
  id: 'external-source-prompt',
  name: 'External source prompt',
  source: { type: 'open-food-facts', country: 'world', query: {} },
  barcode: { type: 'none' },
});

export const finalPrompt: Prompts['final-prompt'] = copy({
  ...basePrompt,
  component: 'final-prompt',
  type: 'standard',
  id: 'final-prompt',
  name: 'Final prompt',
  rating: false,
});

export const foodSearchPrompt: Prompts['food-search-prompt'] = copy({
  ...basePrompt,
  component: 'food-search-prompt',
  type: 'standard',
  id: 'food-search-prompt',
  name: 'Food search prompt',
  allowBrowsing: true,
  dualLanguage: false,
  ...foodBrowserDefaults,
});

export const mealAddPrompt: Prompts['meal-add-prompt'] = copy({
  ...basePrompt,
  component: 'meal-add-prompt',
  type: 'standard',
  id: 'meal-add-prompt',
  name: 'Meal Add prompt',
  custom: false,
  unique: false,
});

export const mealDurationPrompt: Prompts['meal-duration-prompt'] = copy({
  ...basePrompt,
  component: 'meal-duration-prompt',
  type: 'standard',
  id: 'meal-duration-prompt',
  name: 'Meal Duration prompt',
  slider: {
    type: 'slider',
    current: {
      value: 30,
      label: { en: 'minutes' },
      size: 75,
    },
    min: {
      value: 5,
      label: false,
    },
    max: {
      value: 120,
      label: false,
    },
    step: 5,
    confirm: false,
  },
});

export const mealGapPrompt: Prompts['meal-gap-prompt'] = copy({
  ...basePrompt,
  component: 'meal-gap-prompt',
  type: 'standard',
  id: 'meal-gap-prompt',
  name: 'Meal Time Gap prompt',
  gap: 180,
  startTime: '09:00',
  endTime: '21:00',
});

export const mealTimePrompt: Prompts['meal-time-prompt'] = copy({
  ...basePrompt,
  component: 'meal-time-prompt',
  type: 'standard',
  id: 'meal-time-prompt',
  name: 'Meal Time prompt',
  allowedMinutes: 5,
  amPmToggle: false,
  format: '24hr',
  ui: 'md-clock',
});

export const readyMealPrompt: Prompts['ready-meal-prompt'] = copy({
  ...basePrompt,
  component: 'ready-meal-prompt',
  type: 'standard',
  id: 'ready-meal-prompt',
  name: 'Ready meal prompt',
});

export const recallDatePrompt: Prompts['recall-date-prompt'] = copy({
  ...basePrompt,
  component: 'recall-date-prompt',
  type: 'standard',
  id: 'recall-date-prompt',
  name: 'Recall date prompt',
  current: null,
  min: null,
  max: null,
});

export const redirectPrompt: Prompts['redirect-prompt'] = copy({
  ...basePrompt,
  component: 'redirect-prompt',
  type: 'standard',
  id: 'redirect-prompt',
  name: 'Redirect prompt',
  rating: false,
  url: null,
  identifier: 'username',
  timer: 0,
  target: '_self',
});

export const reviewConfirmPrompt: Prompts['review-confirm-prompt'] = copy({
  ...basePrompt,
  component: 'review-confirm-prompt',
  type: 'standard',
  id: 'review-confirm-prompt',
  name: 'Review and Confirm prompt',
});

export const sameAsBeforePrompt: Prompts['same-as-before-prompt'] = copy({
  ...basePrompt,
  component: 'same-as-before-prompt',
  type: 'standard',
  id: 'same-as-before-prompt',
  name: 'Same as before prompt',
});

export const splitFoodPrompt: Prompts['split-food-prompt'] = copy({
  ...basePrompt,
  component: 'split-food-prompt',
  type: 'standard',
  id: 'split-food-prompt',
  name: 'Split food prompt',
});

export const submitPrompt: Prompts['submit-prompt'] = copy({
  ...basePrompt,
  component: 'submit-prompt',
  type: 'standard',
  id: 'submit-prompt',
  name: 'Submit prompt',
  review: {
    desktop: false,
    mobile: false,
  },
});

export const generalAssociatedFoodsPrompt: Prompts['general-associated-foods-prompt'] = copy({
  ...basePrompt,
  component: 'general-associated-foods-prompt',
  type: 'standard',
  id: 'general-associated-foods-prompt',
  name: 'Generalised associated foods prompt',
  categoryCode: '',
  promptText: {},
  genericName: {},
  multiple: false,
  skipPortionSize: false,
  ...foodBrowserDefaults,
});

export const standardPrompts = [
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
  splitFoodPrompt,
  submitPrompt,
];
