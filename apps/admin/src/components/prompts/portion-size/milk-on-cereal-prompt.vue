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
import { defineComponent } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { basePrompt, ImageMapSettings } from '../partials';

export default defineComponent({
  name: 'MilkOnCerealPrompt',

  components: { ImageMapSettings },

  mixins: [basePrompt],

  props: {
    badges: {
      type: Boolean as PropType<Prompts['milk-on-cereal-prompt']['badges']>,
      required: true,
    },
    imageMap: {
      type: Object as PropType<Prompts['milk-on-cereal-prompt']['imageMap']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
