<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12" md="6">
        <linked-quantity
          :model-value="linkedQuantity"
          @update:model-value="update('linkedQuantity', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <image-map-settings
          :model-value="imageMap"
          @update:model-value="update('imageMap', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.badges')"
          :model-value="badges"
          @update:model-value="update('badges', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          hide-details="auto"
          :items="quantityCardStyles"
          :label="$t('survey-schemes.prompts.quantityCard._')"
          :model-value="quantityCard"
          variant="outlined"
          @update:model-value="update('quantityCard', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { useI18n } from '@intake24/ui';

import { ImageMapSettings, LinkedQuantity, useBasePrompt } from '../partials';

const props = defineProps({
  badges: {
    type: Boolean as PropType<Prompts['guide-image-prompt']['badges']>,
    required: true,
  },
  imageMap: {
    type: Object as PropType<Prompts['guide-image-prompt']['imageMap']>,
    required: true,
  },
  linkedQuantity: {
    type: Object as PropType<Prompts['guide-image-prompt']['linkedQuantity']>,
    required: true,
  },
  quantityCard: {
    type: String as PropType<Prompts['guide-image-prompt']['quantityCard']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { i18n } = useI18n();

const quantityCardStyles = (['classic', 'accessible'] as const).map(item => ({
  title: i18n.t(`survey-schemes.prompts.quantityCard.${item}`),
  value: item,
}));

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
