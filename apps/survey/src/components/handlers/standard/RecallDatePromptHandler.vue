<template>
  <recall-date-prompt
    v-model="state"
    v-bind="{ prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { RecallDatePrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, usePromptHandlerNoStore } from '../composables';

defineProps(createHandlerProps<'recall-date-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();

const getInitialState = computed(() => survey.data.recallDate);

const { state } = usePromptHandlerNoStore({ emit }, getInitialState);

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commitAnswer();

  emit('action', type, ...args);
}

function commitAnswer() {
  survey.setRecallDate(state.value);
}
</script>

<style scoped></style>
