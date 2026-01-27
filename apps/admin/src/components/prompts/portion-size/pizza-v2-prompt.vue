<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
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
  name: 'PizzaV2Prompt',

  components: { ImageMapSettings },

  mixins: [basePrompt],

  props: {
    imageMap: {
      type: Object as PropType<Prompts['pizza-v2-prompt']['imageMap']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
