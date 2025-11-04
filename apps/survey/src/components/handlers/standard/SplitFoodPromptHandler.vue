<template>
  <split-food-prompt
    v-bind="{ food, meal, prompt, section, suggestions: splits.suggestions }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { SplitFoodPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';
import { getEntityId, getFoodIndexRequired } from '@intake24/survey/util';
import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils } from '../composables';

defineProps(createHandlerProps<'split-food-prompt'>());

const emit = defineEmits(['action']);

const { freeTextFood, meals } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();
const survey = useSurvey();

const food = freeTextFood.value;

const splits = computed(() => {
  const suggestionTokens: string[] = [];
  const forceTokens: string[] = [];

  const items = survey.parameters?.locale?.splitWords;
  if (!items?.length)
    return { suggestions: [], force: false };

  for (const item of items) {
    if (item.match(/^!\w+:\w+!$/)) {
      forceTokens.push(item
        .replace(/!/g, '')
        .split(':')
        .sort((a, b) => a.localeCompare(b))
        .join(':')
        .toLowerCase(),
      );
      continue;
    }

    suggestionTokens.push(item.replace(/!_!/g, ' ').toLowerCase());
  }

  const suggestions = food.description.split(new RegExp(`(?:${suggestionTokens.join('|')})`, 'i')).map(item => item.trim());
  const forceCheck = [...suggestions].sort((a, b) => a.localeCompare(b)).join(':').toLowerCase();
  const force = forceTokens.includes(forceCheck);

  return { suggestions, force };
});

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

onMounted(() => {
  if (splits.value.force) {
    separate();
    return;
  }

  if (splits.value.suggestions.length <= 1)
    single();
});
</script>
