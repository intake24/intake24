<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.meal-add-prompt.custom')"
          :model-value="custom"
          @update:model-value="update('custom', $event)"
        />
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.meal-add-prompt.unique')"
          :model-value="unique"
          @update:model-value="update('unique', $event)"
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
  name: 'MealAddPrompt',

  mixins: [basePrompt],

  props: {
    custom: {
      type: Boolean as PropType<Prompts['meal-add-prompt']['custom']>,
      required: true,
    },
    unique: {
      type: Boolean as PropType<Prompts['meal-add-prompt']['unique']>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
