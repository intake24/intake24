<template>
  <v-tabs-window-item value="options">
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <external-source-settings
            v-bind="{ source }"
            @update:source="update('source', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <barcode-settings
            v-bind="{ barcode }"
            @update:barcode="update('barcode', $event)"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { BarcodeSettings, basePrompt, ExternalSourceSettings } from '../partials';

export default defineComponent({
  name: 'ExternalSourcePrompt',

  components: { BarcodeSettings, ExternalSourceSettings },

  mixins: [basePrompt],

  props: {
    barcode: {
      type: Object as PropType<Prompts['external-source-prompt']['barcode']>,
      required: true,
    },
    source: {
      type: Object as PropType<Prompts['external-source-prompt']['source']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
