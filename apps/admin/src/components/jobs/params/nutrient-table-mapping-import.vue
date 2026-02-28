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

<script lang="ts" setup>
import { SelectResource } from '@intake24/admin/components/dialogs';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'NutrientTableMappingImport'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'NutrientTableMappingImport'>(props, { emit });
</script>

<style scoped></style>
