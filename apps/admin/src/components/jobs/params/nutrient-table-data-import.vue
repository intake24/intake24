<template>
  <div>
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col v-if="!disabled.nutrientTableId" cols="12">
          <select-resource
            v-model="params.nutrientTableId"
            :error-messages="errors.get('params.nutrientTableId')"
            item-name="description"
            :label="$t('nutrient-tables.id')"
            name="nutrientTableId"
            resource="nutrient-tables"
          />
        </v-col>
        <v-col cols="12">
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
  name: 'NutrientTableDataImport',

  components: { SelectResource },

  mixins: [jobParams<JobParams['NutrientTableDataImport']>()],
});
</script>

<style scoped></style>
