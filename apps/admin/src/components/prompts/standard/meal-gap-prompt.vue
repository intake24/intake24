<template>
  <v-tabs-window-item value="options">
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-time-picker
            :landscape="$vuetify.display.smAndUp"
            :model-value="startTime"
            :title="$t('survey-schemes.prompts.meal-gap-prompt.startTime')"
            @update:model-value="update('startTime', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-time-picker
            :landscape="$vuetify.display.smAndUp"
            :model-value="endTime"
            :title="$t('survey-schemes.prompts.meal-gap-prompt.endTime')"
            @update:model-value="update('endTime', $event)"
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

<script lang="ts">
import type { PropType } from 'vue';

import type { RuleCallback } from '@intake24/admin/types';
import type { Prompts } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'MealGapPrompt',

  mixins: [basePrompt],

  props: {
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
  },

  computed: {
    gapRules(): RuleCallback[] {
      return [
        (value: string | null): boolean | string =>
          Number.isInteger(value) || 'Time gap value needs to be an integer.',
      ];
    },
  },

  methods: {
    updateGapValue(value: any) {
      const gapValue = Number.parseInt(value, 10);
      this.update('gap', Number.isNaN(gapValue) ? 180 : gapValue);
    },
  },
});
</script>

<style lang="scss" scoped></style>
