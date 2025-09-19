<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12" md="7">
        <v-card border flat>
          <v-toolbar color="grey-lighten-4">
            <v-icon end icon="fas fa-bed" />
            <v-toolbar-title>
              {{ $t('survey-schemes.prompts.sleep-schedule-prompt.schedule') }}
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text class="d-flex flex-column flex-sm-row pa-0">
            <v-time-picker
              :landscape="$vuetify.display.smAndUp"
              :model-value="wakeUpTime"
              :title="$t('survey-schemes.prompts.sleep-schedule-prompt.wakeUpTime')"
              @update:model-value="update('wakeUpTime', $event)"
            />
            <v-time-picker
              :landscape="$vuetify.display.smAndUp"
              :model-value="sleepTime"
              :title="$t('survey-schemes.prompts.sleep-schedule-prompt.sleepTime')"
              @update:model-value="update('sleepTime', $event)"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col class="px-4" cols="12" md="5">
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
import { TimePickerSettings, timerPickerProps, useBasePrompt } from '../partials';

const props = defineProps({
  ...timerPickerProps,
  wakeUpTime: {
    type: String as PropType<Prompts['sleep-schedule-prompt']['wakeUpTime']>,
    required: true,
  },
  sleepTime: {
    type: String as PropType<Prompts['sleep-schedule-prompt']['sleepTime']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
