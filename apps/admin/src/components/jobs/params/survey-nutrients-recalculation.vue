<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-if="!disabled.surveyId"
      v-model="params.surveyId"
      :error-messages="errors.get('params.surveyId')"
      :label="$t('jobs.types.SurveyNutrientsRecalculation.surveyId')"
      name="surveyId"
      resource="surveys"
    />
    <v-select
      v-model="params.mode"
      :error-messages="errors.get('params.mode')"
      item-title="text"
      item-value="value"
      :items="modeOptions"
      :label="$t('jobs.types.SurveyNutrientsRecalculation.mode.label')"
      name="mode"
    >
      <template #item="{ item, props }">
        <v-list-item v-bind="props">
          <template #subtitle>
            <div class="text-caption">
              {{ item.raw.description }}
            </div>
          </template>
        </v-list-item>
      </template>
    </v-select>
    <v-checkbox
      v-if="params.mode !== 'none'"
      v-model="params.syncFields"
      :error-messages="errors.get('params.syncFields')"
    >
      <template #label>
        <div>
          <div>{{ $t('jobs.types.SurveyNutrientsRecalculation.syncFields.label') }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ $t('jobs.types.SurveyNutrientsRecalculation.syncFields.description') }}
          </div>
        </div>
      </template>
    </v-checkbox>
    <v-alert
      v-if="params.mode === 'values-and-codes'"
      class="mt-4"
      color="warning"
      variant="tonal"
    >
      <v-alert-title>{{ $t('jobs.types.SurveyNutrientsRecalculation.mappingChanges.title') }}</v-alert-title>
      <div class="text-body-2">
        {{ $t('jobs.types.SurveyNutrientsRecalculation.mappingChanges.description') }}
        <ul class="mt-2 list-disc pl-4">
          <li>{{ $t('jobs.types.SurveyNutrientsRecalculation.mappingChanges.impact.historicalData') }}</li>
          <li>{{ $t('jobs.types.SurveyNutrientsRecalculation.mappingChanges.impact.exportedDatasets') }}</li>
        </ul>
        {{ $t('jobs.types.SurveyNutrientsRecalculation.mappingChanges.warning') }}
      </div>
    </v-alert>
  </div>
</template>

<script lang="ts" setup>
import type { RecalculationMode } from '@intake24/common/types/jobs';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { useI18n } from '@intake24/ui';

import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'SurveyNutrientsRecalculation'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'SurveyNutrientsRecalculation'>(props, { emit });

const { i18n } = useI18n();

const modeOptions: { value: RecalculationMode; text: string; description: string }[] = [
  {
    value: 'none',
    text: i18n.t('jobs.types.SurveyNutrientsRecalculation.mode.options.none.label'),
    description: i18n.t('jobs.types.SurveyNutrientsRecalculation.mode.options.none.description'),
  },
  {
    value: 'values-only',
    text: i18n.t('jobs.types.SurveyNutrientsRecalculation.mode.options.valuesOnly.label'),
    description: i18n.t('jobs.types.SurveyNutrientsRecalculation.mode.options.valuesOnly.description'),
  },
  {
    value: 'values-and-codes',
    text: i18n.t('jobs.types.SurveyNutrientsRecalculation.mode.options.valuesAndCodes.label'),
    description: i18n.t('jobs.types.SurveyNutrientsRecalculation.mode.options.valuesAndCodes.description'),
  },
];
</script>

<style scoped></style>
