<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-if="!disabled.localeId"
      v-model="params.localeId"
      :error-messages="errors.get('params.localeId')"
      item-name="englishName"
      :label="$t('jobs.types.LocaleFoodNutrientMapping.localeId')"
      name="localeId"
      resource="locales"
    />
    <select-resource
      v-model="params.nutrientTableId"
      :error-messages="errors.get('params.nutrientTableId')"
      item-name="description"
      :label="$t('jobs.types.LocaleFoodNutrientMapping.nutrientTableId')"
      name="nutrientTableId"
      resource="nutrient-tables"
    />
    <v-alert
      :color="hasTable ? 'success' : 'warning'"
      density="compact"
      variant="tonal"
    >
      {{ hasTable
        ? $t('jobs.types.LocaleFoodNutrientMapping.alert.ndb')
        : $t('jobs.types.LocaleFoodNutrientMapping.alert.allTables') }}
    </v-alert>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'LocaleFoodNutrientMapping'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'LocaleFoodNutrientMapping'>(props, { emit });

const hasTable = computed(() => !!params.value.nutrientTableId?.trim());
</script>

<style scoped></style>
