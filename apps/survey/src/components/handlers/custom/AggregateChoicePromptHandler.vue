<template>
  <aggregate-choice-prompt
    v-model="state"
    v-bind="{ filteredMeals, prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import type { FoodState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { AggregateChoicePrompt } from '@intake24/survey/components/prompts/custom';
import { filterMealsForAggregateChoicePrompt } from '@intake24/survey/dynamic-recall/prompt-filters';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useCustomPromptHandler, usePromptHandlerNoStore } from '../composables';

const props = defineProps(createHandlerProps<'aggregate-choice-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();
const { resolvePromptAnswer } = useCustomPromptHandler(props);

const filteredMeals = computed(() => filterMealsForAggregateChoicePrompt(survey, props.prompt));

const getInitialState = computed(() =>
  Object.fromEntries(filteredMeals.value.flatMap(meal => meal.foods.map(food => [food.id, resolvePromptAnswer(props.prompt, food)]))));

// TODO: use store for intermediate state
const { state } = usePromptHandlerNoStore({ emit }, getInitialState);

function commitAnswer() {
  function commitAnswers(food: FoodState) {
    const answer = state.value[food.id];
    if (answer !== undefined)
      food.customPromptAnswers[props.prompt.id] = answer;

    for (const linkedFood of food.linkedFoods) {
      commitAnswers(linkedFood);
    }
  }

  survey.meals.forEach(meal => meal.foods.forEach(food => commitAnswers(food)));
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next') {
    commitAnswer();
    emit('action', type);
    return;
  }
  emit('action', type, ...args);
}
</script>

<style scoped></style>
