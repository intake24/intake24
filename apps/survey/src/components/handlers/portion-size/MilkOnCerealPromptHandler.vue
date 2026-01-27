<template>
  <milk-on-cereal-prompt
    v-model="state"
    v-bind="{
      food,
      meal,
      parentFood,
      portionSizeMethods,
      prompt,
      section,
    }"
    @action="actionPortionSize"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import type { PromptStates } from '@intake24/common/prompts';

import { MilkOnCerealPrompt } from '@intake24/survey/components/prompts';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'milk-on-cereal-prompt'>());

const emit = defineEmits(['action']);

const {
  encodedFood: food,
  encodedFoodPortionSizeData,
  parentFoodOptional: parentFood,
  portionSizeMethods,
} = useFoodPromptUtils<'milk-on-cereal'>();
const { meal } = useMealPromptUtils();

function getInitialState(): PromptStates['milk-on-cereal-prompt'] {
  return {
    portionSize: encodedFoodPortionSizeData.value ?? {
      method: 'milk-on-cereal',
      imageUrl: null,
      bowl: null,
      bowlId: undefined,
      bowlIndex: undefined,
      milkLevelId: undefined,
      milkLevelIndex: undefined,
      milkLevelImage: null,
      servingWeight: 0,
      leftoversWeight: 0,
    },
    panel: food.value.portionSizeMethodIndex !== null ? 1 : 0,
    bowlConfirmed: false,
    milkLevelConfirmed: false,
  };
}

const { state, actionPortionSize, update } = usePromptHandlerStore(props, { emit }, getInitialState);
</script>
