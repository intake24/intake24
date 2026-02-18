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

function commitAnswer() {
  survey.setRecallDate(state.value);
}

const { state, action } = usePromptHandlerNoStore({ emit }, getInitialState, commitAnswer);
</script>

<style scoped></style>
