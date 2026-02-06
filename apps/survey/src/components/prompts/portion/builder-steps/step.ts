import type { FoodBuilderStepState } from '@intake24/common/prompts';

export function isStepValid<T extends FoodBuilderStepState>(step: T): boolean {
  switch (step.type) {
    case 'coefficient':
    case 'condition':
    case 'lookup':
      return step.option !== null;
    case 'ingredient': {
      const foodSelected = step.foods.length > 0;

      if (step.required || step.confirmed === 'yes')
        return step.multiple ? foodSelected && step.anotherFoodConfirmed === false : foodSelected;
      else
        return step.confirmed === 'no';
    }
  }

  return false;
}

export function getNextStep<T extends FoodBuilderStepState>(steps: T[]) {
  return steps.findIndex(step => !isStepValid(step));
}
