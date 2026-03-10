<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12">
        <v-text-field
          :label="$t('survey-schemes.prompts.unknown-prompt.weight')"
          :model-value="weight"
          @update:model-value="updateNumber('weight', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { useBasePrompt } from '../partials';

const props = defineProps({
  weight: {
    type: Number as PropType<Prompts['unknown-prompt']['weight']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { updateNumber } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
