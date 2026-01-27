<template>
  <div v-if="!disabled.localeId">
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-switch
            v-model="params.force"
            :error-messages="errors.get('params.force')"
            :label="$t('jobs.types.LocaleIndexBuild.force')"
            name="force"
          />
        </v-col>
      </v-row>
    </v-card-text>
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
