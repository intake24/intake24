<template>
  <milk-in-a-hot-drink-prompt
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

import { MilkInAHotDrinkPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'milk-in-a-hot-drink-prompt'>());

const emit = defineEmits(['action']);

const {
  encodedFood: food,
  encodedFoodPortionSizeData,
  parentEncodedFood: parentFood,
  portionSizeMethods,
} = useFoodPromptUtils<'milk-in-a-hot-drink'>();
const { meal } = useMealPromptUtils();

function getInitialState(): PromptStates['milk-in-a-hot-drink-prompt'] {
  return {
    portionSize: encodedFoodPortionSizeData.value ?? {
      method: 'milk-in-a-hot-drink',
      milkPartIndex: null,
      milkVolumePercentage: null,
      servingWeight: 0,
      leftoversWeight: 0,
    },
    panel: food.value.portionSizeMethodIndex !== null ? 1 : 0,
  };
}

function commitAnswer() {
  const {
    portionSize: { milkVolumePercentage },
  } = state.value;

  if (!milkVolumePercentage) {
    console.warn(`Milk volume percentage is not set yet.`);
    return;
  }

  if (!parentFood.value)
    throw new Error('Milk in a hot drink prompt: parent food not found.');

  if (
    !parentFood.value.portionSize
    || parentFood.value.portionSize.servingWeight === null
    || parentFood.value.portionSize.leftoversWeight === null
  ) {
    throw new Error('Milk in a hot drink prompt: Parent food missing portion size data');
  }

  const { servingWeight, leftoversWeight } = parentFood.value.portionSize;

  const drinkPortionSize = {
    ...parentFood.value.portionSize,
    servingWeight: servingWeight * (1 - milkVolumePercentage),
    leftoversWeight: leftoversWeight * (1 - milkVolumePercentage),
  };

  const milkPortionSize = {
    ...state.value.portionSize,
    servingWeight: servingWeight * milkVolumePercentage,
    leftoversWeight: leftoversWeight * milkVolumePercentage,
  };

  const survey = useSurvey();

  survey.updateFood({ foodId: food.value.id, update: { portionSize: milkPortionSize } });
  survey.updateFood({
    foodId: parentFood.value.id,
    update: { portionSize: drinkPortionSize },
  });
  survey.addFoodFlag(food.value.id, 'portion-size-method-complete');

  clearStoredState();
}

const { state, action, update, clearStoredState } = usePromptHandlerStore(props, { emit }, getInitialState, commitAnswer);
</script>
