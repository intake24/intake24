<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12" md="6">
        <time-picker-settings
          v-bind="{ allowedMinutes, amPmToggle, format, ui }"
          @update:allowed-minutes="update('allowedMinutes', $event)"
          @update:am-pm-toggle="update('amPmToggle', $event)"
          @update:format="update('format', $event)"
          @update:ui="update('ui', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Prompts } from '@intake24/common/prompts';
import { TimePickerSettings, useBasePrompt } from '../partials';

defineOptions({ name: 'TimePickerPrompt' });

const props = defineProps({
  allowedMinutes: {
    type: Number as PropType<Prompts['meal-time-prompt']['allowedMinutes']>,
    required: true,
  },
  amPmToggle: {
    type: Boolean as PropType<Prompts['meal-time-prompt']['amPmToggle']>,
    required: true,
  },
  format: {
    type: String as PropType<Prompts['meal-time-prompt']['format']>,
    required: true,
  },
  ui: {
    type: String as PropType<Prompts['meal-time-prompt']['ui']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
