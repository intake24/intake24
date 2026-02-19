import type { Ref, SetupContext } from 'vue';

import type { FoodBuilderLookupResourceStepState, FoodBuilderStepState, Prompts, PromptStates } from '@intake24/common/prompts';
import type { FoodBuilderState, PromptSection } from '@intake24/common/surveys';
import type { UserFoodData } from '@intake24/common/types/http';
import type { FoodBuilderStep, FoodBuilderStepType } from '@intake24/common/types/http/admin';
import type { UseMealUtilsProps } from '@intake24/survey/composables';

import { computed, ref } from 'vue';

import { copy } from '@intake24/common/util';
import { categoriesService, foodsService } from '@intake24/survey/services';

type FoodBuilderPrompt = 'generic-builder-prompt' | 'recipe-builder-prompt';

export type UsePromptProps<P extends FoodBuilderPrompt, F extends FoodBuilderState> = UseMealUtilsProps & {
  food: F;
  localeId: string;
  modelValue: PromptStates[P];
  prompt: Prompts[P];
  section: PromptSection;
};

export function useFoodBuilder<
  P extends FoodBuilderPrompt,
  F extends FoodBuilderState,
>(props: UsePromptProps<P, F>, { emit }: Pick<SetupContext<'update:modelValue'[]>, 'emit'>) {
  const state = ref(copy(props.modelValue)) as Ref<Pick<PromptStates, FoodBuilderPrompt>[P]>;
  const foods = ref<UserFoodData[]>([]);

  function isStepValid<T extends FoodBuilderStepState, T2 extends FoodBuilderStep>(state: T, step: T2): boolean {
    switch (state.type) {
      case 'coefficient':
      case 'condition':
      case 'lookup-resource':
      case 'lookup-unit':
        return state.option !== null;
      case 'ingredient': {
        const foodSelected = state.foods.length > 0;

        if (state.type !== step.type)
          return false;

        if (step.required || state.confirmed === 'yes')
          return step.multiple ? foodSelected && state.anotherFoodConfirmed === false : foodSelected;
        else
          return state.confirmed === 'no';
      }
      case 'quantity':
        return state.confirmed;
    }

    return false;
  }

  const stepsConfirmed = computed(() => state.value.steps.every((step, idx) => isStepValid(step, props.food.template.steps[idx])));
  const isValid = computed(() => stepsConfirmed.value);

  function getNextStep<T extends FoodBuilderStepState, T2 extends FoodBuilderStep>(states: T[], steps: T2[]): number {
    return states.findIndex((state, index) => !isStepValid(state, steps[index]));
  }

  function goToNextIfCan(index: number) {
    if (!isStepValid(state.value.steps[index], props.food.template.steps[index]))
      return;

    state.value.activeStep = getNextStep(state.value.steps, props.food.template.steps);
  };

  function update() {
    emit('update:modelValue', state.value);
  };

  const depsResolution: Partial<Record<FoodBuilderStepType, (step: any) => Promise<void>>> = {
    'lookup-resource': async (step: FoodBuilderLookupResourceStepState) => {
      if (!step.option)
        return;

      const data = await categoriesService.contents(props.localeId, step.option);

      foods.value = await Promise.all(
        data.foods.map(({ code }) => foodsService.getData(props.localeId, code)),
      );
    },
  };

  async function clearNextSteps(index: number) {
    for (let i = index + 1; i < state.value.steps.length; i++) {
      const step = state.value.steps[i];
      switch (step.type) {
        case 'coefficient':
        case 'condition':
        case 'lookup-resource':
          step.option = null;
          break;
        case 'lookup-unit':
          if ('portionSize' in state.value)
            state.value.portionSize.unit = null;

          step.option = null;
          break;
        case 'ingredient':
        /* step.foods = [];
        step.confirmed = undefined;
        step.anotherFoodConfirmed = undefined; */
          break;
        case 'quantity':
          if ('portionSize' in state.value)
            state.value.portionSize.quantity = 1;

          step.quantity = 1;
          step.confirmed = false;
          break;
      }
    }
  };

  async function resolveStepDependency(index: number) {
    for (let i = index; i < state.value.steps.length; i++) {
      const step = state.value.steps[i];
      if (!isStepValid(step, props.food.template.steps[i]))
        break;

      if (!depsResolution[step.type])
        continue;

      await depsResolution[step.type]?.(step);
    }
  };

  async function stepUpdate(index: number) {
    await clearNextSteps(index);
    await resolveStepDependency(index);
    goToNextIfCan(index);
    update();
  };

  return {
    foods,
    state,
    isStepValid,
    isValid,
    stepsConfirmed,
    stepUpdate,
    resolveStepDependency,
    update,
  };
}
