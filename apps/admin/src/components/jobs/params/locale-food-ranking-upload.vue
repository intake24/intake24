<template>
  <div>
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
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
      <v-row>
        <v-col cols="12">
          <v-select
            v-model="params.targetAlgorithm"
            :error-messages="errors.get('params.targetAlgorithm')"
            :items="searchSortingAlgorithms"
            :label="$t('jobs.types.LocaleFoodRankingUpload.targetAlgorithm')"
            name="targetAlgorithm"
            variant="outlined"
            @update:model-value="errors.clear('params.targetAlgorithm')"
          />
        </v-col>
      </v-row>
      <v-row v-if="params.targetAlgorithm === 'popularity' || params.targetAlgorithm === 'globalPop'">
        <v-col cols="12">
          <v-alert
            elevation="2"
            prominent
            type="warning"
            variant="tonal"
          >
            <h4 class="mb-6">
              {{ $t('jobs.types.LocaleFoodRankingUpload.warningTitle') }}
            </h4>
            <p>{{ $t('jobs.types.LocaleFoodRankingUpload.warningP1') }}</p>
            <p>{{ $t('jobs.types.LocaleFoodRankingUpload.warningP2') }}</p>
            <p>{{ $t('jobs.types.LocaleFoodRankingUpload.warningP3') }}</p>
            <p>{{ $t('jobs.types.LocaleFoodRankingUpload.warningP4') }}</p>
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { searchSortingAlgorithms } from '@intake24/common/surveys';
import { useI18n } from '@intake24/ui';

import jobParams from './job-params';

export default defineComponent({
  name: 'LocaleFoodRankingUpload',

  mixins: [jobParams<JobParams['LocaleFoodRankingUpload']>()],

  setup() {
    const { i18n } = useI18n();

    return {
      searchSortingAlgorithms: searchSortingAlgorithms.map(value => ({
        value,
        title: i18n.t(`surveys.search.algorithms.${value}`),
      })),
    };
  },
});
</script>

<style scoped></style>
