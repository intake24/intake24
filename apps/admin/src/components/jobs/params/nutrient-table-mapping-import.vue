<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-if="!disabled.nutrientTableId"
      v-model="params.nutrientTableId"
      :error-messages="errors.get('params.nutrientTableId')"
      item-name="description"
      :label="$t('nutrient-tables.id')"
      name="nutrientTableId"
      resource="nutrient-tables"
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
  name: 'NutrientTableMappingImport',

  components: { SelectResource },

  mixins: [jobParams<JobParams['NutrientTableMappingImport']>()],
});
</script>

<style scoped></style>
