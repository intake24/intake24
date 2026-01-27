<template>
  <div>
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-select
            v-model="params.type"
            :error-messages="errors.get('params.type')"
            hide-details="auto"
            :items="eventTypes"
            name="type"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12">
          <select-resource
            v-model="params.surveyId"
            :error-messages="errors.get('params.surveyId')"
            :label="$t('surveys.id')"
            name="surveyId"
            resource="surveys"
          />
        </v-col>
        <v-col cols="12">
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
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { eventTypes } from '@intake24/common/types';

import jobParams from './job-params';

export default defineComponent({
  name: 'SurveyEventNotification',

  components: { SelectResource },

  mixins: [jobParams<JobParams['SurveyEventNotification']>()],

  setup() {
    return { eventTypes };
  },
});
</script>

<style scoped></style>
