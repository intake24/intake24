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
import { TimePickerSettings, timerPickerProps, useBasePrompt } from '../partials';

defineOptions({ name: 'TimePickerPrompt' });

const props = defineProps(timerPickerProps);

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
