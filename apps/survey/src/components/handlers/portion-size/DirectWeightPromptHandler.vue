<template>
  <direct-weight-prompt
    v-model="state"
    v-bind="{
      food,
      meal,
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

import { DirectWeightPrompt } from '@intake24/survey/components/prompts';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'direct-weight-prompt'>());

const emit = defineEmits(['action']);

const {
  encodedFood: food,
  encodedFoodPortionSizeData,
  portionSizeMethods,
} = useFoodPromptUtils<'direct-weight'>();
const { meal } = useMealPromptUtils();

function getInitialState(): PromptStates['direct-weight-prompt'] {
  return {
    portionSize: encodedFoodPortionSizeData.value ?? {
      method: 'direct-weight',
      quantity: null,
      servingWeight: 0,
      leftoversWeight: 0,
    },
    panel: food.value.portionSizeMethodIndex !== null ? 1 : 0,
  };
}

const { state, actionPortionSize, update } = usePromptHandlerStore(props, { emit }, getInitialState);
</script>
