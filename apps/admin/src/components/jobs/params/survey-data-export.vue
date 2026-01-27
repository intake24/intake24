<template>
  <div>
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col v-if="!disabled.surveyId" cols="12">
          <select-resource
            v-model="params.surveyId"
            :error-messages="errors.get('params.surveyId')"
            :label="$t('surveys.id')"
            name="surveyId"
            resource="surveys"
          />
        </v-col>
        <v-col cols="12">
          <date-picker
            v-model="params.startDate"
            clearable
            :error-messages="errors.get('params.startDate')"
            :label="$t('surveys.startDate')"
          />
        </v-col>
        <v-col cols="12">
          <date-picker
            v-model="params.endDate"
            clearable
            :error-messages="errors.get('params.endDate')"
            :label="$t('surveys.endDate')"
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
import { DatePicker } from '@intake24/admin/components/forms';

import jobParams from './job-params';

export default defineComponent({
  name: 'SurveyDataExport',

  components: { DatePicker, SelectResource },

  mixins: [jobParams<JobParams['SurveyDataExport']>()],
});
</script>

<style scoped></style>
