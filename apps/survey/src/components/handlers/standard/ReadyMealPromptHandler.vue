<template>
  <ready-meal-prompt
    v-if="state.length"
    v-model="state"
    v-bind="{ meal, prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import type { EncodedFood } from '@intake24/common/surveys';

import { computed, onMounted } from 'vue';

import { ReadyMealPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useMealPromptUtils, usePromptHandlerNoStore } from '../composables';

defineProps(createHandlerProps<'ready-meal-prompt'>());

const emit = defineEmits(['action']);

const { meal } = useMealPromptUtils();
const survey = useSurvey();

const alreadyAnswered = computed(() => meal.value.flags.includes('ready-meal-complete'));

const getInitialState = computed(() =>
  (
    meal.value.foods.filter(
      food => food.type === 'encoded-food' && food.data.readyMealOption,
    ) as EncodedFood[]
  ).map(food => ({
    id: food.id,
    name: food.data.localName,
    value: alreadyAnswered.value ? food.flags.includes('ready-meal') : undefined,
  })),
);

function commitAnswer() {
  for (const food of state.value)
    survey.setFoodFlag(food.id, 'ready-meal', !!food.value);

  survey.addMealFlag(meal.value.id, 'ready-meal-complete');
}

const { state, action } = usePromptHandlerNoStore({ emit }, getInitialState, commitAnswer);

onMounted(() => {
  if (!state.value.length)
    action('next');
});
</script>

<style scoped></style>
