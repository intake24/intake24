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
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.badges')"
          :model-value="badges"
          @update:model-value="update('badges', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { LinkedQuantity, useBasePrompt } from '../partials';

const props = defineProps({
  badges: {
    type: Boolean as PropType<Prompts['standard-portion-prompt']['badges']>,
    required: true,
  },
  linkedQuantity: {
    type: Object as PropType<Prompts['standard-portion-prompt']['linkedQuantity']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
