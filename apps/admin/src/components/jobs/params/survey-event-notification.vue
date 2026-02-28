<template>
  <div class="d-flex flex-column ga-4">
    <v-select
      v-model="params.type"
      :error-messages="errors.get('params.type')"
      hide-details="auto"
      :items="eventTypes"
      name="type"
      variant="outlined"
    />
    <select-resource
      v-model="params.surveyId"
      :error-messages="errors.get('params.surveyId')"
      :label="$t('surveys.id')"
      name="surveyId"
      resource="surveys"
    />
    <v-text-field
      v-if="params.type === 'survey.session.submitted'"
      v-model="params.submissionId"
      :error-messages="errors.get('params.submissionId')"
      hide-details="auto"
      :label="$t('surveys.submissions.id')"
      name="submissionId"
      variant="outlined"
    />
    <v-text-field
      v-else
      v-model="params.sessionId"
      :error-messages="errors.get('params.sessionId')"
      hide-details="auto"
      :label="$t('surveys.sessions.id')"
      name="sessionId"
      variant="outlined"
    />
  </div>
</template>

<script lang="ts" setup>
import { SelectResource } from '@intake24/admin/components/dialogs';
import { eventTypes } from '@intake24/common/types';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'SurveyEventNotification'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'SurveyEventNotification'>(props, { emit });
</script>

<style scoped></style>
