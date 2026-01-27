<template>
  <missing-food-prompt
    v-model="state"
    v-bind="{
      food,
      meal,
      prompt,
      section,
    }"
    @action="action"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import type { PromptStates } from '@intake24/common/prompts';

import { MissingFoodPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'missing-food-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();
const { missingFood: food } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();

function getInitialState(): PromptStates['missing-food-prompt'] {
  return {
    info: food.value.info ?? {
      name: food.value.searchTerm,
      brand: null,
      description: null,
      leftovers: null,
      portionSize: null,
    },
    panel: 0,
    homemadePrompt: undefined,
  };
}

function commitAnswer() {
  const { info } = state.value;

  survey.updateFood({ foodId: food.value.id, update: { info } });
  survey.addFoodFlag(food.value.id, 'missing-food-complete');

  clearStoredState();
}

const { state, action, update, clearStoredState } = usePromptHandlerStore(props, { emit }, getInitialState, commitAnswer);
</script>
