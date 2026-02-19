import type { FoodBuilderStepType, GetFoodBuilderStep } from '@intake24/common/types/http/admin';

import coefficient from './coefficient-step.vue';
import condition from './condition-step.vue';
import ingredient from './ingredient-step.vue';
import lookupResource from './lookup-resource-step.vue';
import lookupUnit from './lookup-unit-step.vue';

export const stepDefaults: Record<FoodBuilderStepType, GetFoodBuilderStep<FoodBuilderStepType>> = {
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
  'lookup-resource': {
    id: '',
    type: 'lookup-resource',
    name: { en: 'Name' },
    description: { en: 'Description' },
    resource: 'categories',
    options: { en: [] },
  },
  'lookup-unit': {
    id: '',
    type: 'lookup-unit',
    name: { en: 'Name' },
    description: { en: 'Description' },
    unit: [],
  },
};

export const steps = {
  coefficient,
  ingredient,
  condition,
  lookupResource,
  lookupUnit,
};
