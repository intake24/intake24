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

<script lang="ts" setup>
import { SelectResource } from '@intake24/admin/components/dialogs';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'LocaleCategories'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'LocaleCategories'>(props, { emit });
</script>

<style scoped></style>
