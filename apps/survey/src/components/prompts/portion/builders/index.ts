import IngredientStep from './ingredient-step.vue';
import QuantityStep from './quantity-step.vue';
import RadioListStep from './radio-list-step.vue';
import UnitStep from './unit-step.vue';

export * from './use-builder';
export * from './use-step';

export const steps = {
  CoefficientStep: RadioListStep,
  ConditionStep: RadioListStep,
  IngredientStep,
  LookupResourceStep: RadioListStep,
  LookupUnitStep: UnitStep,
  QuantityStep,
};
