<template>
  <split-food-prompt
    v-bind="{ food, meal, prompt, section, suggestions: splits.suggestions }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { SplitFoodPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';
import { getEntityId, getFoodIndexRequired } from '@intake24/survey/util';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils } from '../composables';
import { getSplitSuggestions } from './split-food';

defineProps(createHandlerProps<'split-food-prompt'>());

const emit = defineEmits(['action']);

const { freeTextFood, meals } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();
const survey = useSurvey();

const food = freeTextFood.value;

const splits = computed(() =>
  getSplitSuggestions(food.description, survey.parameters?.locale?.splitWords ?? []),
);

function single() {
  survey.addFoodFlag(food.id, 'split-food-complete');
  emit('action', 'next');
}

function separate() {
  const foodId = food.id;
  const { foodIndex } = getFoodIndexRequired(meals.value, foodId);

  const [first, ...rest] = splits.value.suggestions;

  rest.forEach((suggestion, idx) => {
    survey.addFood({
      mealId: meal.value.id,
      food: {
        id: getEntityId(),
        type: 'free-text',
        description: suggestion,
        flags: ['split-food-complete'],
        customPromptAnswers: {},
        linkedFoods: [],
      },
      at: foodIndex + (idx + 1),
    });
  });

  survey.updateFood({ foodId, update: { description: first } });
  survey.addFoodFlag(foodId, 'split-food-complete');
  emit('action', 'next');
}

const splitActions = { single, separate };

function action(type: string, ...args: [id?: string, params?: object]) {
  if (['single', 'separate'].includes(type)) {
    splitActions[type as 'single' | 'separate']();
    return;
  }

  emit('action', type, ...args);
}
</script>
