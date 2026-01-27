<template>
  <final-prompt
    v-bind="{
      feedbackAvailable,
      feedbackEnabled,
      prompt,
      section,
      submissionId,
      surveyId,
    }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { FinalPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps } from '../composables';

defineProps(createHandlerProps<'final-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();
const route = useRoute();

const feedbackAvailable = computed(() => survey.feedbackAvailable);
const feedbackEnabled = computed(() => survey.feedbackEnabled);
const submissionId = computed(() => survey.data.id);
const surveyId = computed(() => route.params.surveyId.toString());

function action(type: string, ...args: [id?: string, params?: object]) {
  emit('action', type, ...args);
}
</script>

<style scoped></style>
