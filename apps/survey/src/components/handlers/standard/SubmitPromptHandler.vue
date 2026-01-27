<template>
  <submit-prompt
    v-bind="{ meals, prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { SubmitPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps } from '../composables';

defineProps(createHandlerProps<'submit-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();

const meals = computed(() => survey.meals);

async function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    await survey.submitRecall();

  emit('action', type, ...args);
}
</script>

<style scoped></style>
