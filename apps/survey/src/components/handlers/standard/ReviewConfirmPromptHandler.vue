<template>
  <review-confirm-prompt
    v-bind="{ meals, prompt, section }"
    @action="action"
    @food-selected="onFoodClick"
    @meal-selected="onMealClick"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { ReviewConfirmPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps } from '../composables';

defineProps(createHandlerProps<'review-confirm-prompt'>());

const emit = defineEmits(['action', 'foodContextMenu', 'mealContextMenu']);

const survey = useSurvey();
const meals = computed(() => survey.meals);

function action(type: string, ...args: [id?: string, params?: object]) {
  emit('action', type, ...args);
};

/* async function submit() {
  await survey.submitRecall();
  emit('action', 'next');
}; */

function onMealClick(payload: { mealId: number }) {
  emit('mealContextMenu', payload);
};

function onFoodClick(payload: { foodId: number }) {
  emit('foodContextMenu', payload);
};
</script>

<style scoped></style>
