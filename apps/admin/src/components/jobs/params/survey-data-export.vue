<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-if="!disabled.surveyId"
      v-model="params.surveyId"
      :error-messages="errors.get('params.surveyId')"
      :label="$t('surveys.id')"
      name="surveyId"
      resource="surveys"
    />
    <date-picker
      v-model="params.startDate"
      clearable
      :error-messages="errors.get('params.startDate')"
      :label="$t('surveys.startDate')"
    />
    <date-picker
      v-model="params.endDate"
      clearable
      :error-messages="errors.get('params.endDate')"
      :label="$t('surveys.endDate')"
    />
  </div>
</template>

<script lang="ts" setup>
import { SelectResource } from '@intake24/admin/components/dialogs';
import { DatePicker } from '@intake24/admin/components/forms';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'SurveyDataExport'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'SurveyDataExport'>(props, { emit });
</script>

<style scoped></style>
