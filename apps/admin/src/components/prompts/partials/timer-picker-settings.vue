<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-icon end icon="fas fa-clock" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.timePicker.title') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text class="d-flex flex-column gr-6">
      <v-select
        v-model="ui"
        hide-details="auto"
        :items="uiStyles"
        :label="$t('survey-schemes.prompts.timePicker.ui._')"
        variant="outlined"
      />
      <v-select
        v-model="allowedMinutes"
        hide-details="auto"
        :items="[1, 5, 10, 15, 20, 30]"
        :label="$t('survey-schemes.prompts.timePicker.allowedMinutes._')"
        prepend-inner-icon="fas fa-stopwatch"
        variant="outlined"
      >
        <template #item="{ item, props }">
          <v-list-item v-bind="props">
            <v-list-item-title>
              <i18n-t keypath="survey-schemes.prompts.timePicker.allowedMinutes.item">
                <template #item>
                  <v-chip class="mx-1">
                    <span>{{ item.raw }}</span>
                  </v-chip>
                </template>
              </i18n-t>
            </v-list-item-title>
          </v-list-item>
        </template>
        <template #selection="{ item }">
          <i18n-t keypath="survey-schemes.prompts.timePicker.allowedMinutes.item">
            <template #item>
              <v-chip class="mx-1">
                <span>{{ item.raw }}</span>
              </v-chip>
            </template>
          </i18n-t>
        </template>
      </v-select>
      <v-select
        v-model="format"
        hide-details="auto"
        :items="formats"
        :label="$t('survey-schemes.prompts.timePicker.format._')"
        variant="outlined"
      />
      <v-switch
        v-model="amPmToggle"
        hide-details="auto"
        :label="$t('survey-schemes.prompts.timePicker.amPmToggle')"
      />
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { TimePicker } from '@intake24/common/prompts';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'TimerPickerSettings' });

const allowedMinutes = defineModel('allowedMinutes', { type: Number as PropType<TimePicker['allowedMinutes']> });
const amPmToggle = defineModel('amPmToggle', { type: Boolean as PropType<TimePicker['amPmToggle']> });
const format = defineModel('format', { type: String as PropType<TimePicker['format']> });
const ui = defineModel('ui', { type: String as PropType<TimePicker['ui']> });

const { i18n } = useI18n();

const formats = ['24hr', 'ampm'].map(item => ({
  title: i18n.t(`survey-schemes.prompts.timePicker.format.${item}`),
  value: item,
}));

const uiStyles = ['digital', 'md-clock'].map(item => ({
  title: i18n.t(`survey-schemes.prompts.timePicker.ui.${item}`),
  value: item,
}));
</script>

<style lang="scss" scoped></style>
