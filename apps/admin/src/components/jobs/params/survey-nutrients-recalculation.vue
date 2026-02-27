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

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';

import jobParams from './job-params';

export default defineComponent({
  name: 'SurveyNutrientsRecalculation',

  components: { SelectResource },

  mixins: [jobParams<JobParams['SurveyNutrientsRecalculation']>()],
});
</script>

<style scoped></style>
