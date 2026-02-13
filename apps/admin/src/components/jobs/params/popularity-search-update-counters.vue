<template>
  <div class="d-flex flex-column ga-4">
    <v-text-field
      v-model="params.localeCode"
      :error-messages="errors.get('params.localeCode')"
      hide-details="auto"
      :label="$t('jobs.types.PopularitySearchUpdateCounters.localeCode')"
      name="localeCode"
      prepend-inner-icon="fas fa-globe"
      variant="outlined"
    />

    <v-combobox
      v-model="params.foodCodes"
      chips
      clearable
      closable-chips
      :error-messages="errors.get('params.foodCodes')"
      hide-details="auto"
      :label="$t('jobs.types.PopularitySearchUpdateCounters.foodCodes')"
      multiple
      name="foodCodes"
      prepend-inner-icon="fas fa-list"
      variant="outlined"
    />
  </div>
</template>

<script lang="ts" setup>
import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'PopularitySearchUpdateCounters'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'PopularitySearchUpdateCounters'>(props, { emit });
</script>

<style scoped></style>
