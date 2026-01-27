<template>
  <portion-size-option-prompt
    v-model="state"
    v-bind="{
      portionSizeMethods,
      food,
      meal,
      parentFood,
      prompt,
      section,
    }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import type { EncodedFood } from '@intake24/common/surveys';

import { computed } from 'vue';

import { PortionSizeOptionPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerNoStore } from '../composables';

defineProps(createHandlerProps<'portion-size-option-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();
const { encodedFood, parentFoodOptional: parentFood, portionSizeMethods } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();

const food = encodedFood.value;

const getInitialState = computed(() => ({ option: food.portionSizeMethodIndex }));

function commitAnswer() {
  const flags = ['portion-size-option-complete'];
  const update: Partial<Omit<EncodedFood, 'type'>> = { portionSizeMethodIndex: state.value.option };

  if (food.portionSizeMethodIndex !== null && food.portionSizeMethodIndex !== state.value.option
  ) {
    update.portionSize = null;
  }

  if (portionSizeMethods.value?.find(item => item.index === state.value.option && item.method === 'unknown')) {
    flags.push('portion-size-method-complete');
    update.portionSize = { method: 'unknown', servingWeight: 0, leftoversWeight: 0 };
  }

  survey.updateFood({ foodId: food.id, update });
  survey.addFoodFlag(food.id, flags);
}

const { state, action } = usePromptHandlerNoStore({ emit }, getInitialState, commitAnswer);
</script>
