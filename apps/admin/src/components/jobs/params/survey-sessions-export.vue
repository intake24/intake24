<template>
  <div v-if="!disabled.surveyId">
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <select-resource
            v-model="params.surveyId"
            :error-messages="errors.get('params.surveyId')"
            :label="$t('surveys.id')"
            name="surveyId"
            resource="surveys"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';

import jobParams from './job-params';

export default defineComponent({
  name: 'SurveySessionsExport',

  components: { SelectResource },

  mixins: [jobParams<JobParams['SurveySessionsExport']>()],
});
</script>

<style scoped></style>
