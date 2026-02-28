<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-if="!disabled.localeId"
      v-model="params.localeId"
      :error-messages="errors.get('params.localeId')"
      item-name="englishName"
      :label="$t('jobs.types.LocaleFoodRankingUpload.localeId')"
      name="localeId"
      resource="locales"
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
    <v-select
      v-model="params.targetAlgorithm"
      :error-messages="errors.get('params.targetAlgorithm')"
      :items="sortingAlgorithms"
      :label="$t('jobs.types.LocaleFoodRankingUpload.targetAlgorithm')"
      name="targetAlgorithm"
      variant="outlined"
      @update:model-value="errors.clear('params.targetAlgorithm')"
    />
  </div>
</template>

<script lang="ts" setup>
import { SelectResource } from '@intake24/admin/components/dialogs';
import { searchSortingAlgorithms } from '@intake24/common/surveys';
import { useI18n } from '@intake24/ui';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'LocaleFoodRankingUpload'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'LocaleFoodRankingUpload'>(props, { emit });

const { i18n } = useI18n();

const sortingAlgorithms = searchSortingAlgorithms.map(value => ({
  value,
  title: i18n.t(`surveys.search.algorithms.${value}`),
}));
</script>

<style scoped></style>
