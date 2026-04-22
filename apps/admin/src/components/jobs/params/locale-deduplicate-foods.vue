<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-if="!disabled.localeId"
      v-model="params.localeId"
      :error-messages="errors.get('params.localeId')"
      item-name="englishName"
      :label="$t('jobs.types.LocaleDeduplicateFoods.localeId')"
      name="localeId"
      resource="locales"
    />
    <v-file-input
      v-model="selectedFile"
      accept=".txt,text/plain"
      :error-messages="fileErrors"
      hide-details="auto"
      :hint="$t('jobs.types.LocaleDeduplicateFoods.uploadHint')"
      :label="$t('jobs.types.LocaleDeduplicateFoods.upload')"
      prepend-icon=""
      prepend-inner-icon="fas fa-paperclip"
      variant="outlined"
      @update:model-value="loadCodesFromFile"
    />
    <v-switch
      v-model="params.dryRun"
      :error-messages="errors.get('params.dryRun')"
      :label="$t('jobs.types.LocaleDeduplicateFoods.dryRun')"
      name="dryRun"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { useI18n } from '@intake24/ui';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'LocaleDeduplicateFoods'>());

const emit = defineEmits(['update:modelValue']);

const newLineRegExp = /\r?\n/;
const bomRegExp = /^\uFEFF/;

const { params } = useJobParams<'LocaleDeduplicateFoods'>(props, { emit });
const { i18n } = useI18n();

const selectedFile = ref<File | null>(null);
const parseError = ref('');
const fileErrors = computed(() => {
  const errors = [...props.errors.get('params.primaryCodes')];

  if (parseError.value)
    errors.unshift(parseError.value);

  return errors;
});

async function loadCodesFromFile(file: File | File[] | null) {
  const uploadedFile = Array.isArray(file) ? (file[0] ?? null) : file;
  selectedFile.value = uploadedFile;
  parseError.value = '';

  if (!uploadedFile) {
    params.value.primaryCodes = [];
    return;
  }

  try {
    const text = await uploadedFile.text();
    const primaryCodes = [...new Set(text
      .split(newLineRegExp)
      .map(line => line.replace(bomRegExp, '').trim())
      .filter(Boolean))];

    params.value.primaryCodes = primaryCodes;
    props.errors.clear('params.primaryCodes');
  }
  catch {
    parseError.value = i18n.t('jobs.types.LocaleDeduplicateFoods.uploadReadError');
  }
}
</script>

<style scoped></style>
