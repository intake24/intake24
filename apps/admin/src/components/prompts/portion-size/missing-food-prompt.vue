<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12" md="6">
        <barcode-settings
          v-bind="{ barcode }"
          @update:barcode="update('barcode', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { BarcodeSettings, basePrompt } from '../partials';

export default defineComponent({
  name: 'MissingFoodPrompt',

  components: { BarcodeSettings },

  mixins: [basePrompt],

  props: {
    barcode: {
      type: Object as PropType<Prompts['external-source-prompt']['barcode']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
