<template>
  <drink-scale-prompt
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

import { computed } from 'vue';

import { DrinkScalePrompt } from '@intake24/survey/components/prompts';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'drink-scale-prompt'>());

const emit = defineEmits(['action']);

const {
  encodedFood: food,
  encodedFoodPortionSizeData,
  parentFoodOptional: parentFood,
  portionSizeMethods,
} = useFoodPromptUtils<'drink-scale'>();

const currentValue = computed(() => {
  if (!props.prompt.multiple)
    return 1;

  return (props.prompt.multiple.type === 'counter' ? props.prompt.multiple.current : props.prompt.multiple.current.value) ?? 1;
});

function getInitialState(): PromptStates['drink-scale-prompt'] {
  return {
    portionSize: encodedFoodPortionSizeData.value ?? {
      method: 'drink-scale',
      drinkwareId: '',
      initialFillLevel: 0.9,
      skipFillLevel: false,
      imageUrl: '',
      containerId: undefined,
      containerIndex: undefined,
      fillLevel: 0,
      servingWeight: 0,
      leftoversLevel: 0,
      leftoversWeight: 0,
      leftovers: false,
      quantity: currentValue.value,
    },
    panel: food.value.portionSizeMethodIndex !== null ? 1 : 0,
    objectConfirmed: false,
    volumeConfirmed: false,
    leftoversConfirmed: false,
    leftoversPrompt: undefined,
    quantityConfirmed: false,
  };
}

const { state, actionPortionSize, update } = usePromptHandlerStore(props, { emit }, getInitialState);
const { meal } = useMealPromptUtils();
</script>
