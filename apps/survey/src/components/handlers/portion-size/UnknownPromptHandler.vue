<template>
  <unknown-prompt
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

import { UnknownPrompt } from '@intake24/survey/components/prompts';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'unknown-prompt'>());

const emit = defineEmits(['action']);

const {
  encodedFood: food,
  encodedFoodPortionSizeData,
  parentFoodOptional: parentFood,
  portionSizeMethods,
} = useFoodPromptUtils<'unknown'>();
const { meal } = useMealPromptUtils();

function getInitialState(): PromptStates['unknown-prompt'] {
  return {
    portionSize: encodedFoodPortionSizeData.value ?? {
      method: 'unknown',
      servingWeight: 0,
      leftoversWeight: 0,
    },
    panel: 0,
  };
}

const { state, actionPortionSize, update } = usePromptHandlerStore(props, { emit }, getInitialState);
</script>
