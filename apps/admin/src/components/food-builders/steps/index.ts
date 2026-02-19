import type { FoodBuilderStepType, GetFoodBuilderStep } from '@intake24/common/types/http/admin';

import coefficient from './coefficient-step.vue';
import condition from './condition-step.vue';
import ingredient from './ingredient-step.vue';
import lookupEntity from './lookup-entity-step.vue';
import lookupUnit from './lookup-unit-step.vue';
import selectEntity from './select-entity-step.vue';

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
  'lookup-entity': {
    id: '',
    type: 'lookup-entity',
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
  quantity: {
    id: '',
    type: 'quantity',
    name: { en: 'Name' },
    description: { en: 'Description' },
  },
  'select-entity': {
    id: '',
    type: 'select-entity',
    name: { en: 'Name' },
    description: { en: 'Description' },
    resource: 'categories',
    value: '',
  },
};

export const steps = {
  coefficient,
  ingredient,
  condition,
  lookupEntity,
  lookupUnit,
  selectEntity,
};
