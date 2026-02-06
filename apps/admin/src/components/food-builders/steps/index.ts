import type { FoodBuilderStepType, GetFoodBuilderStep } from '@intake24/common/types/http/admin';

import coefficient from './coefficient-step.vue';
import condition from './condition-step.vue';
import ingredient from './ingredient-step.vue';
import lookup from './lookup-step.vue';

export const stepDefaults: Record<FoodBuilderStepType, GetFoodBuilderStep<FoodBuilderStepType>> = {
  lookup: {
    id: '',
    type: 'lookup',
    name: { en: 'Name' },
    description: { en: 'Description' },
    resource: 'categories',
    options: { en: [] },
  },
  coefficient: {
    id: '',
    type: 'coefficient',
    name: { en: 'Name' },
    description: { en: 'Description' },
    options: { en: [] },
  },
  condition: {
    id: '',
    type: 'condition',
    name: { en: 'Name' },
    description: { en: 'Description' },
    options: { en: [] },
  },
  ingredient: {
    id: '',
    type: 'ingredient',
    name: { en: 'Name' },
    description: { en: 'Description' },
    categoryCode: '',
    multiple: false,
    required: false,
  },
};

export const steps = {
  coefficient,
  ingredient,
  condition,
  lookup,
};
