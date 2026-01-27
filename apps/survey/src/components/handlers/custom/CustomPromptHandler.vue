<template>
  <component
    :is="prompt.component"
    :key="prompt.id"
    v-model="state"
    v-bind="{
      meal: mealOptional,
      food: foodOptional,
      prompt,
      section,
    }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import type { CustomPromptAnswer } from '@intake24/common/surveys';

import { computed, ref } from 'vue';

import { customPrompts } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useCustomPromptHandler } from '../composables';

defineOptions({ components: { ...customPrompts } });

const props = defineProps(createHandlerProps());

const emit = defineEmits(['action']);

const infoPrompts = ['info-prompt'];

const { commitPromptAnswer, resolvePromptAnswer, foodOptional, mealOptional }
  = useCustomPromptHandler(props);
const survey = useSurvey();

const isInfoPrompt = computed(() => infoPrompts.includes(props.prompt.component));
const state = ref<CustomPromptAnswer | undefined>(
  isInfoPrompt.value ? 'next' : resolvePromptAnswer(props.prompt),
);

function commitAnswer() {
  if (props.prompt.component === 'no-more-information-prompt') {
    const newSelection = survey.selection;
    newSelection.mode = 'auto';
    survey.setSelection(newSelection);
  }

  commitPromptAnswer(props.prompt, state.value);
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next' || isInfoPrompt.value)
    commitAnswer();

  emit('action', type, ...args);
}
</script>

<style scoped></style>
