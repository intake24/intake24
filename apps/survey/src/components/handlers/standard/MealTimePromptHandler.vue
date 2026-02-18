<template>
  <meal-time-prompt
    v-model="state"
    v-bind="{ meal, prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { MealTimePrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';
import { pushFullHistoryEntry } from '@intake24/survey/stores/recall-history';

import { createHandlerProps, useMealPromptUtils, usePromptHandlerNoStore } from '../composables';

defineProps(createHandlerProps<'meal-time-prompt'>());

const emit = defineEmits(['action']);

const { meal } = useMealPromptUtils();
const survey = useSurvey();

const getInitialState = computed(() => meal.value.time ?? meal.value.defaultTime);

function commitAnswer() {
  survey.setMealTime(meal.value.id, state.value);
}

const { state, action: composableAction } = usePromptHandlerNoStore({ emit }, getInitialState, commitAnswer);

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'cancel') {
    pushFullHistoryEntry('meal-time-prompt (cancel)');
    survey.deleteMeal(meal.value.id);
    emit('action', 'next');
    return;
  }

  composableAction(type, ...args);
}
</script>

<style scoped></style>
