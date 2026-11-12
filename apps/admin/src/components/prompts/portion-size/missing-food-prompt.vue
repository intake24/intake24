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

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { BarcodeSettings, useBasePrompt } from '../partials';

defineOptions({ name: 'MissingFoodPrompt' });

const props = defineProps({
  barcode: {
    type: Object as PropType<Prompts['external-source-prompt']['barcode']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
