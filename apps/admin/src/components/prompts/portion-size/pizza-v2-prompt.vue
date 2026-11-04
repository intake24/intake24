<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12" md="6">
        <image-map-settings
          :model-value="imageMap"
          @update:model-value="update('imageMap', $event)"
        />
        <v-select
          class="mt-4"
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

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

import { useI18n } from '@intake24/ui';

import { basePrompt, ImageMapSettings } from '../partials';

export default defineComponent({
  name: 'PizzaV2Prompt',

  components: { ImageMapSettings },

  mixins: [basePrompt],

  props: {
    imageMap: {
      type: Object as PropType<Prompts['pizza-v2-prompt']['imageMap']>,
      required: true,
    },
    quantityCard: {
      type: String as PropType<Prompts['pizza-v2-prompt']['quantityCard']>,
      required: true,
    },
  },

  setup() {
    const { i18n } = useI18n();
    const quantityCardStyles = (['classic', 'accessible'] as const).map(item => ({
      title: i18n.t(`survey-schemes.prompts.quantityCard.${item}`),
      value: item,
    }));

    return { quantityCardStyles };
  },
});
</script>

<style lang="scss" scoped></style>
