<template>
  <meal-duration-prompt
    v-model="state"
    v-bind="{ meal, prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { MealDurationPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useMealPromptUtils, usePromptHandlerNoStore } from '../composables';

const props = defineProps(createHandlerProps<'meal-duration-prompt'>());

const emit = defineEmits(['action']);

const { meal } = useMealPromptUtils();
const survey = useSurvey();

const getInitialState = computed(
  () => props.prompt.slider.current.value || props.prompt.slider.min.value || 0,
);

function commitAnswer() {
  survey.setMealDuration(meal.value.id, state.value);
}

const { state, action } = usePromptHandlerNoStore({ emit }, getInitialState, commitAnswer);
</script>

<style scoped></style>
