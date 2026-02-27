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
    <v-file-input
      v-model="params.file"
      :error-messages="errors.get('params.file')"
      hide-details="auto"
      :label="$t('common.file.csv')"
      name="file"
      prepend-icon=""
      prepend-inner-icon="fas fa-paperclip"
      variant="outlined"
      @change="errors.clear('params.file')"
    />
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';

import jobParams from './job-params';

export default defineComponent({
  name: 'SurveyRespondentsImport',

  components: { SelectResource },

  mixins: [jobParams<JobParams['SurveyRespondentsImport']>()],
});
</script>

<style scoped></style>
