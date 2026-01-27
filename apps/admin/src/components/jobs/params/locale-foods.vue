<template>
  <div v-if="!disabled.localeId">
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <select-resource
            v-model="params.localeId"
            :error-messages="errors.get('params.localeId')"
            item-name="englishName"
            :label="$t('jobs.types.LocaleFoods.localeId')"
            name="localeId"
            resource="locales"
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
  name: 'LocaleFoods',

  components: { SelectResource },

  mixins: [jobParams<JobParams['LocaleFoods']>()],
});
</script>

<style scoped></style>
