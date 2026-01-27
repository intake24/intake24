<template>
  <parent-food-portion-prompt
    v-model="state"
    v-bind="{
      food,
      meal,
      parentFood,
      portionSizeMethods,
      prompt,
      section,
    }"
    @action="action"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import type { PromptStates } from '@intake24/common/prompts';

import { ParentFoodPortionPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'parent-food-portion-prompt'>());

const emit = defineEmits(['action']);

const {
  encodedFood: food,
  encodedFoodPortionSizeData,
  parentEncodedFood: parentFood,
  portionSizeMethods,
} = useFoodPromptUtils<'parent-food-portion'>();
const { meal } = useMealPromptUtils();

function getInitialState(): PromptStates['parent-food-portion-prompt'] {
  return {
    portionSize: encodedFoodPortionSizeData.value ?? {
      method: 'parent-food-portion',
      portionIndex: null,
      portionValue: null,
      servingWeight: 0,
      leftoversWeight: 0,
    },
    panel: food.value.portionSizeMethodIndex !== null ? 1 : 0,
  };
}

function commitAnswer() {
  const {
    portionSize: { portionValue },
  } = state.value;

  if (!portionValue) {
    console.warn(`Parent food portion is not set yet.`);
    return;
  }

  if (!parentFood.value)
    throw new Error('Parent food portion prompt: parent food not found.');

  if (
    !parentFood.value.portionSize
    || parentFood.value.portionSize.servingWeight === null
    || parentFood.value.portionSize.leftoversWeight === null
  ) {
    throw new Error('Parent food portion prompt: Parent food missing portion size data');
  }

  const { servingWeight, leftoversWeight } = parentFood.value.portionSize;

  const portionSize = {
    ...state.value.portionSize,
    servingWeight: servingWeight * portionValue,
    leftoversWeight: leftoversWeight * portionValue,
  };

  const survey = useSurvey();

  survey.updateFood({ foodId: food.value.id, update: { portionSize } });
  survey.addFoodFlag(food.value.id, 'portion-size-method-complete');

  clearStoredState();
}

const { state, action, update, clearStoredState } = usePromptHandlerStore(props, { emit }, getInitialState, commitAnswer);
</script>
