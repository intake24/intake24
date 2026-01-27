<template>
  <meal-gap-prompt v-bind="{ meals, prompt, section }" @action="action" />
</template>

<script lang="ts" setup>
import { resolveMealGaps } from '@intake24/common/surveys';
import { MealGapPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps } from '../composables';

const props = defineProps(createHandlerProps<'meal-gap-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();

const meals = resolveMealGaps(survey.meals, props.prompt);

function commit() {
  const [startMeal, endMeal] = meals;

  if (startMeal && endMeal) {
    survey.addMealFlag(startMeal.id, 'no-meals-between');
    return;
  }

  if (startMeal)
    survey.addMealFlag(startMeal.id, 'no-meals-before');
  if (endMeal)
    survey.addMealFlag(endMeal.id, 'no-meals-after');
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commit();

  emit('action', type, ...args);
}
</script>

<style scoped></style>
