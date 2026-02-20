<template>
  <div v-if="!disabled.surveyId">
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <select-resource
            v-model="params.surveyId"
            :error-messages="errors.get('params.surveyId')"
            :label="$t('surveys.id')"
            name="surveyId"
            resource="surveys"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="params.mode"
            :error-messages="errors.get('params.mode')"
            hide-details="auto"
            item-title="text"
            item-value="value"
            :items="modeOptions"
            label="Recalculation mode"
            name="mode"
            variant="outlined"
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
        </v-col>
        <v-col v-if="params.mode !== 'none'" cols="12">
          <v-checkbox
            v-model="params.syncFields"
            :error-messages="errors.get('params.syncFields')"
            hide-details="auto"
          >
            <template #label>
              <div>
                <div>Sync nutrient variables and fields</div>
                <div class="text-caption text-medium-emphasis">
                  Add new nutrients/fields, remove dropped ones, and update all values. Without this, only existing values are updated.
                </div>
              </div>
            </template>
          </v-checkbox>
        </v-col>
      </v-row>

      <v-alert
        v-if="params.mode === 'values-and-codes'"
        class="mt-4"
        color="warning"
        variant="tonal"
      >
        <v-alert-title>Important: Data Changes</v-alert-title>
        <div class="text-body-2">
          This will update nutrient composition codes in submitted data. This may affect:
          <ul class="mt-2">
            <li>Historical data comparability</li>
            <li>Audit trails and data provenance</li>
            <li>Previously exported datasets</li>
          </ul>
          Consider backing up data before proceeding.
        </div>
      </v-alert>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';
import type { RecalculationMode } from '@intake24/common/types/jobs';

import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';

import jobParams from './job-params';

export default defineComponent({
  name: 'SurveyNutrientsRecalculation',

  components: { SelectResource },

  mixins: [jobParams<JobParams['SurveyNutrientsRecalculation']>()],

  data() {
    return {
      modeOptions: [
        {
          value: 'none' as RecalculationMode,
          text: 'None',
          description: 'Skip recalculation (no changes)',
        },
        {
          value: 'values-only' as RecalculationMode,
          text: 'Values only (Default)',
          description: 'Recalculate existing nutrient values using stored nutrient table codes',
        },
        {
          value: 'values-and-codes' as RecalculationMode,
          text: 'Values and nutrient codes',
          description: 'Update nutrient codes to current food mappings and recalculate values',
        },
      ],
    };
  },
});
</script>

<style scoped></style>
