<template>
  <as-served-prompt
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

import { computed } from 'vue';

import { AsServedPrompt } from '@intake24/survey/components/prompts';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'as-served-prompt'>());

const emit = defineEmits(['action']);

const {
  encodedFood: food,
  encodedFoodPortionSizeData,
  linkedParent,
  linkedParentQuantity,
  parentFoodOptional: parentFood,
  portionSizeMethods,
} = useFoodPromptUtils<'as-served'>();
const { meal } = useMealPromptUtils();

const currentValue = computed(() => {
  if (!props.prompt.multiple)
    return 1;

  return (props.prompt.multiple.type === 'counter' ? props.prompt.multiple.current : props.prompt.multiple.current.value) ?? 1;
});

function getInitialState(): PromptStates['as-served-prompt'] {
  return {
    portionSize: encodedFoodPortionSizeData.value ?? {
      method: 'as-served',
      serving: null,
      leftovers: null,
      linkedQuantity: linkedParentQuantity.value,
      servingWeight: 0,
      leftoversWeight: 0,
      quantity: currentValue.value,
    },
    panel: food.value.portionSizeMethodIndex !== null ? 1 : 0,
    servingImageConfirmed: false,
    leftoversPrompt: undefined,
    leftoversImageConfirmed: false,
    linkedQuantityConfirmed: false,
    quantityConfirmed: false,
  };
}

const { state, actionPortionSize, update } = usePromptHandlerStore(props, { emit }, getInitialState);
</script>
