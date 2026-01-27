<template>
  <v-card class="card-screen d-flex flex-column" :color="detail.color" height="100%">
    <v-img :aspect-ratio="16 / 9" cover :src="backgroundImage" />
    <!-- <div v-if="isFiveADay" ref="gaugeRef" class="gauge-container"></div> -->
    <div v-if="detail.showIntake.includes('summary')" class="pa-4 font-weight-medium text-body-2" :class="textColor">
      <i18n-t class="mb-2" keypath="feedback.intake.your" tag="div">
        <template #nutrient>
          <span>{{ detail.name.toLowerCase() }}</span>
        </template>
        <template #amount>
          <span :class="textColor ?? detail.textClass">
            {{ formatOutput(detail.intake, detail.unit) }}
          </span>
        </template>
      </i18n-t>
      <div v-if="detail.recommendedIntake" :class="textColor ?? detail.textClass">
        <v-icon :icon="detail.iconClass" start>
          <span>{{ formatOutput(detail.recommendedIntake.toString(), detail.unit) }}</span>
        </v-icon>
      </div>
    </div>
    <v-card-text v-if="detail.summary" class="flex-grow-1" :class="textColor">
      <div class="card-screen__summary" v-html="detail.summary" />
    </v-card-text>
    <tell-me-more v-bind="{ detail, textColor }" />
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FeedbackCardParameters } from '@intake24/ui/feedback';

import { computed } from 'vue';

import { getContrastYIQ } from '@intake24/ui/util';

import TellMeMore from './tell-me-more.vue';
import { useCard } from './use-card';

const props = defineProps({
  parameters: {
    type: Object as PropType<FeedbackCardParameters>,
    required: true,
  },
});

const { backgroundImage, detail, formatOutput } = useCard(props);

const textColor = computed(() => getContrastYIQ(detail.value.color) < 128 ? 'text-white' : undefined);
</script>

<style lang="scss">
.card-screen {
  .card-screen__summary p {
    margin-bottom: 4px !important;
  }
}

/* .gauge-container {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;

  .gauge {
    .dial {
      stroke: #eee7;
      stroke-width: 15;
      fill: rgba(0, 0, 0, 0);
    }

    .value {
      stroke-width: 15;
      fill: rgba(0, 0, 0, 0);
    }
  }
} */
</style>
