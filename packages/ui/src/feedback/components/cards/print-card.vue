<template>
  <v-container class="print-card pa-0" fluid>
    <v-row class="print-card-header mt-2" no-gutters>
      <v-col cols="4">
        <v-img :aspect-ratio="4 / 3" class="ms-4" cover eager :src="backgroundImage" />
      </v-col>
      <v-col class="d-flex flex-column" cols>
        <v-card-title class="font-weight-medium py-0">
          {{ detail.name }}
        </v-card-title>
        <v-card-text class="d-flex flex-column py-0 font-weight-medium">
          <i18n-t class="mb-2" keypath="feedback.intake.your" tag="div">
            <template #nutrient>
              <span>{{ detail.name.toLowerCase() }}</span>
            </template>
            <template #amount>
              <span :class="detail.textClass">{{ formatOutput(detail.intake, detail.unit) }}</span>
            </template>
          </i18n-t>
          <div v-if="detail.recommendedIntake" :class="detail.textClass">
            <v-icon :icon="detail.iconClass" start />
            <span>{{ formatOutput(detail.recommendedIntake.toString(), detail.unit) }}</span>
          </div>
          <div class="mt-auto" v-html="detail.unitDescription" />
        </v-card-text>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12">
        <v-card-text>
          <div v-html="detail.description" />
        </v-card-text>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FeedbackCardParameters } from '@intake24/ui/feedback';

import { useCard } from './use-card';

const props = defineProps({
  parameters: {
    type: Object as PropType<FeedbackCardParameters>,
    required: true,
  },
});

const { backgroundImage, detail, formatOutput } = useCard(props);
</script>

<style lang="scss">
@media print {
  .print-card {
    // For card per-page
    // page-break-after: page;
    // break-after: page;

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .print-card-header {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
}
</style>
