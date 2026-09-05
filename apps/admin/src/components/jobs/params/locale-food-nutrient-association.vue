<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-if="!disabled.localeId"
      v-model="params.localeId"
      :error-messages="errors.get('params.localeId')"
      item-name="englishName"
      :label="$t('jobs.types.LocaleFoodNutrientAssociation.localeId')"
      name="localeId"
      resource="locales"
    />
    <v-select
      v-model="params.mode"
      :error-messages="errors.get('params.mode')"
      :items="modes"
      :label="$t('jobs.types.LocaleFoodNutrientAssociation.mode')"
      name="mode"
      variant="outlined"
    />
    <v-file-input
      v-if="params.mode === 'associate'"
      v-model="selectedFile"
      :error-messages="errors.get('params.file')"
      hide-details="auto"
      :label="$t('common.file.csv')"
      name="file"
      prepend-icon=""
      prepend-inner-icon="fas fa-paperclip"
      variant="outlined"
      @change="errors.clear('params.file')"
    />
    <template v-else>
      <select-resource
        v-model="params.sourceNutrientTableId"
        :error-messages="errors.get('params.sourceNutrientTableId')"
        item-name="description"
        :label="$t('jobs.types.LocaleFoodNutrientAssociation.sourceNutrientTableId')"
        name="sourceNutrientTableId"
        resource="nutrient-tables"
      />
      <select-resource
        v-model="params.targetNutrientTableId"
        :error-messages="errors.get('params.targetNutrientTableId')"
        item-name="description"
        :label="$t('jobs.types.LocaleFoodNutrientAssociation.targetNutrientTableId')"
        name="targetNutrientTableId"
        resource="nutrient-tables"
      />
    </template>
    <v-switch
      v-model="params.dryRun"
      :error-messages="errors.get('params.dryRun')"
      :label="$t('jobs.types.LocaleFoodNutrientAssociation.dryRun')"
      name="dryRun"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { useI18n } from '@intake24/ui';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'LocaleFoodNutrientAssociation'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'LocaleFoodNutrientAssociation'>(props, { emit });
const { i18n } = useI18n();
const selectedFile = computed<File | File[] | null>({
  get: () => params.value.mode === 'associate' ? params.value.file as unknown as File | File[] | null : null,
  set: (file) => {
    if (params.value.mode === 'associate')
      params.value.file = file as unknown as string;
  },
});
const modes = computed(() => ['associate', 'replace'].map(value => ({
  value,
  title: i18n.t(`jobs.types.LocaleFoodNutrientAssociation.modes.${value}`),
})));
</script>

<style scoped></style>
