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

import { createHandlerProps, useMealPromptUtils, usePromptHandlerNoStore } from '../composables';

defineProps(createHandlerProps<'meal-time-prompt'>());

const emit = defineEmits(['action']);

const { meal } = useMealPromptUtils();
const survey = useSurvey();

const getInitialState = computed(() => meal.value.time ?? meal.value.defaultTime);

const { state } = usePromptHandlerNoStore({ emit }, getInitialState);

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next') {
    commitAnswer();
    emit('action', type);
    return;
  }
  if (type === 'cancel') {
    survey.deleteMeal(meal.value.id);
    emit('action', 'next');
    return;
  }

  emit('action', type, ...args);
}

function commitAnswer() {
  survey.setMealTime(meal.value.id, state.value);
}
</script>

<style scoped></style>
