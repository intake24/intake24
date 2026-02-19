import type { PropType, SetupContext } from 'vue';

import type { FoodBuilderStepState, GetFoodBuilderStateStep, Prompts } from '@intake24/common/prompts';
import type { PromptSection } from '@intake24/common/surveys';
import type { FoodBuilderStepType, GetFoodBuilderStep } from '@intake24/common/types/http/admin';

export function createStepProps<S extends FoodBuilderStepType>() {
  return {
    disabled: {
      type: Boolean as PropType<boolean>,
    },
    localeId: {
      type: String,
      required: true,
    },
    modelValue: {
      type: Object as PropType<GetFoodBuilderStateStep<S>>,
      required: true,
    },
    prompt: {
      type: Object as PropType<Prompts['generic-builder-prompt' | 'recipe-builder-prompt']>,
      required: true,
    },
    section: {
      type: String as PropType<PromptSection>,
      required: true,
    },
    step: {
      type: Object as PropType<GetFoodBuilderStep<S>>,
      required: true,
    },
    states: {
      type: Array as PropType<FoodBuilderStepState[]>,
      required: true,
    },
    surveySlug: {
      type: String,
    },
  } as const;
};

export type UseStepProps<S extends FoodBuilderStepType> = {
  disabled?: boolean;
  localeId: string;
  modelValue: GetFoodBuilderStateStep<S>;
  prompt: Prompts['generic-builder-prompt' | 'recipe-builder-prompt'];
  step: GetFoodBuilderStep<S>;
  states: FoodBuilderStepState[];
  surveySlug?: string;
};

export function useStep<S extends FoodBuilderStepType>(
  props: UseStepProps<S>,
  { emit }: Pick<SetupContext<'update:modelValue'[]>, 'emit'>,
) {
  function getStepState<T extends FoodBuilderStepType>(type: T): GetFoodBuilderStateStep<T> | undefined {
    const state = props.states.find(s => s.type === type);

    return state ? state as GetFoodBuilderStateStep<T> : undefined;
  }

  function update<T extends keyof GetFoodBuilderStateStep<S>>(key: T, value: GetFoodBuilderStateStep<S>[T]) {
    emit('update:modelValue', { ...props.modelValue, [key]: value });
  }

  return {
    getStepState,
    update,
  };
}
