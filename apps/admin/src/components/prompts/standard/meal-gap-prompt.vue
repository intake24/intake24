<template>
  <v-tabs-window-item value="options">
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-time-picker
            :model-value="startTime"
            :title="$t('survey-schemes.prompts.meal-gap-prompt.startTime')"
            @update:model-value="updateTime('startTime', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-time-picker
            :model-value="endTime"
            :title="$t('survey-schemes.prompts.meal-gap-prompt.endTime')"
            @update:model-value="updateTime('endTime', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-card-title>{{ $t('survey-schemes.prompts.meal-gap-prompt.gap') }}</v-card-title>
          <v-text-field
            hide-details="auto"
            :label="$t('survey-schemes.prompts.meal-gap-prompt.gap')"
            :model-value="gap"
            name="gap"
            :rules="gapRules"
            variant="outlined"
            @update:model-value="updateGapValue"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { RuleCallback } from '@intake24/admin/types';
import type { Prompts } from '@intake24/common/prompts';

import { useBasePrompt } from '../partials';

defineOptions({ name: 'MealGapPrompt' });

const props = defineProps({
  gap: {
    type: Number as PropType<Prompts['meal-gap-prompt']['gap']>,
    required: true,
  },
  startTime: {
    type: String as PropType<Prompts['meal-gap-prompt']['startTime']>,
    required: true,
  },
  endTime: {
    type: String as PropType<Prompts['meal-gap-prompt']['endTime']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update, updateTime } = useBasePrompt(props, { emit });

const gapRules: RuleCallback[] = [
  (value: string | null): boolean | string =>
    Number.isInteger(value) || 'Time gap value needs to be an integer.',
];

function updateGapValue(value: string) {
  const gapValue = Number.parseInt(value, 10);
  update('gap', Number.isNaN(gapValue)
    ? 180
    : gapValue);
}
</script>

<style lang="scss" scoped></style>
