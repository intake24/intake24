<template>
  <standard-portion-prompt
    v-model="state"
    v-bind="{
      food,
      linkedParent,
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

import { StandardPortionPrompt } from '@intake24/survey/components/prompts';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'standard-portion-prompt'>());

const emit = defineEmits(['action']);

const {
  encodedFood: food,
  encodedFoodPortionSizeData,
  linkedParent,
  linkedParentQuantity,
  parentFoodOptional: parentFood,
  portionSizeMethods,
} = useFoodPromptUtils<'standard-portion'>();
const { meal } = useMealPromptUtils();

function getInitialState(): PromptStates['standard-portion-prompt'] {
  return {
    portionSize: encodedFoodPortionSizeData.value ?? {
      method: 'standard-portion',
      unit: null,
      quantity: 1,
      linkedQuantity: linkedParentQuantity.value,
      servingWeight: 0,
      leftoversWeight: 0,
    },
    panel: food.value.portionSizeMethodIndex !== null ? 1 : 0,
    quantityConfirmed: false,
    linkedQuantityConfirmed: false,
  };
}

const { state, actionPortionSize, update } = usePromptHandlerStore(props, { emit }, getInitialState);
</script>
