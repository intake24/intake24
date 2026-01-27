<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.badges')"
          :model-value="badges"
          @update:model-value="update('badges', $event)"
        />
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.leftovers')"
          :model-value="leftovers"
          @update:model-value="update('leftovers', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <image-map-settings
          :model-value="imageMap"
          @update:model-value="update('imageMap', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

import { basePrompt, ImageMapSettings } from '../partials';

export default defineComponent({
  name: 'CerealPrompt',

  components: { ImageMapSettings },

  mixins: [basePrompt],

  props: {
    badges: {
      type: Boolean as PropType<Prompts['cereal-prompt']['badges']>,
      required: true,
    },
    imageMap: {
      type: Object as PropType<Prompts['cereal-prompt']['imageMap']>,
      required: true,
    },
    leftovers: {
      type: Boolean as PropType<Prompts['cereal-prompt']['leftovers']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
