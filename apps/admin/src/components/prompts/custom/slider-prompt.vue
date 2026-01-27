<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12">
        <slider-settings
          class="mt-4"
          :hide="['confirm', 'strategy']"
          :model-value="slider"
          @update:model-value="update('slider', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

import { basePrompt, SliderSettings } from '../partials';

export default defineComponent({
  name: 'SliderPrompt',

  components: { SliderSettings },

  mixins: [basePrompt],

  props: {
    slider: {
      type: Object as PropType<Prompts['slider-prompt']['slider']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
