<template>
  <redirect-prompt
    v-bind="{
      feedbackAvailable,
      feedbackEnabled,
      followUpUrl,
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

import { RedirectPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps } from '../composables';

const props = defineProps(createHandlerProps<'redirect-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();
const route = useRoute();

const feedbackAvailable = computed(() => survey.feedbackAvailable);
const feedbackEnabled = computed(() => survey.feedbackEnabled);
const followUpUrl = computed(() => {
  const followUpUrl = survey.user?.followUpUrl ?? undefined;
  if (!followUpUrl || typeof followUpUrl === 'string')
    return followUpUrl;

  return followUpUrl[props.prompt.id];
});
const submissionId = computed(() => survey.data.id);
const surveyId = computed(() => route.params.surveyId.toString());

function action(type: string, ...args: [id?: string, params?: object]) {
  emit('action', type, ...args);
}
</script>

<style scoped></style>
