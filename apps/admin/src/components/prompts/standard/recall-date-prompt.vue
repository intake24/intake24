<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          hide-details="auto"
          :label="$t('survey-schemes.prompts.date-picker-prompt.current')"
          :model-value="current"
          name="current"
          variant="outlined"
          @update:model-value="updateNumber('current', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          hide-details="auto"
          :label="$t('survey-schemes.prompts.date-picker-prompt.min')"
          :model-value="min"
          name="min"
          variant="outlined"
          @update:model-value="updateNumber('min', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          hide-details="auto"
          :label="$t('survey-schemes.prompts.date-picker-prompt.max')"
          :model-value="max"
          name="max"
          variant="outlined"
          @update:model-value="updateNumber('max', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'RecallDatePrompt',

  mixins: [basePrompt],

  props: {
    current: {
      type: Number as PropType<Prompts['recall-date-prompt']['current']>,
      default: null,
    },
    min: {
      type: Number as PropType<Prompts['recall-date-prompt']['min']>,
      default: null,
    },
    max: {
      type: Number as PropType<Prompts['recall-date-prompt']['max']>,
      default: null,
    },
  },
});
</script>

<style lang="scss" scoped></style>
