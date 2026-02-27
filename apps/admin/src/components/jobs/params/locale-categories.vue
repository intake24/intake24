<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-if="!disabled.localeId"
      v-model="params.localeId"
      :error-messages="errors.get('params.localeId')"
      item-name="englishName"
      :label="$t('jobs.types.LocaleCategories.localeId')"
      name="localeId"
      resource="locales"
    />
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';

import jobParams from './job-params';

export default defineComponent({
  name: 'LocaleCategories',

  components: { SelectResource },

  mixins: [jobParams<JobParams['LocaleCategories']>()],
});
</script>

<style scoped></style>
