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

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { SliderSettings, useBasePrompt } from '../partials';

defineOptions({ name: 'MealDurationPrompt' });

const props = defineProps({
  slider: {
    type: Object as PropType<Prompts['meal-duration-prompt']['slider']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
