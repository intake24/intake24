<template>
  <edit-meal-prompt
    v-model="state"
    v-bind="{ meal, prompt, section }"
    @action="action"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import type { PromptStates } from '@intake24/common/prompts';

import { EditMealPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'edit-meal-prompt'>());

const emit = defineEmits(['action']);

const { meal } = useMealPromptUtils();
const survey = useSurvey();

const getInitialState = (): PromptStates['edit-meal-prompt'] => meal.value.foods;

function commitAnswer() {
  const mealId = meal.value.id;

  survey.setFoods({ mealId, foods: state.value });
  survey.addMealFlag(mealId, 'free-entry-complete');

  clearStoredState();
}

const { state, action, update, clearStoredState } = usePromptHandlerStore(
  props,
  { emit },
  getInitialState,
  commitAnswer,
);
</script>
