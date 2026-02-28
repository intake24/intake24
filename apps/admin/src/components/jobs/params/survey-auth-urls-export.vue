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
  </div>
</template>

<script lang="ts" setup>
import { SelectResource } from '@intake24/admin/components/dialogs';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'SurveyAuthUrlsExport'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'SurveyAuthUrlsExport'>(props, { emit });
</script>

<style scoped></style>
