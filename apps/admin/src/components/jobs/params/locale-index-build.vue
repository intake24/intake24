<template>
  <div class="d-flex flex-column ga-4">
    <v-switch
      v-model="params.force"
      :error-messages="errors.get('params.force')"
      :label="$t('jobs.types.LocaleIndexBuild.force')"
      name="force"
    />
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import jobParams from './job-params';

export default defineComponent({
  name: 'LocaleIndexBuild',

  mixins: [jobParams<JobParams['LocaleIndexBuild']>()],
});
</script>

<style scoped></style>
