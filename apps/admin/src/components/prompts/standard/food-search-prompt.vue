<template>
  <v-tabs-window-item value="options">
    <v-row class="ml-2">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.food-search-prompt.allowBrowsing')"
          :model-value="allowBrowsing"
          @update:model-value="update('allowBrowsing', $event)"
        />
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.food-search-prompt.dualLanguage')"
          :model-value="dualLanguage"
          @update:model-value="update('dualLanguage', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <food-browser-settings
          v-bind="{ categoriesFirst, allowThumbnails, enableGrid, gridThreshold }"
          @update="update($event.field, $event.value)"
        />
      </v-col>
      <v-col cols="12">
        <food-search-hints
          :model-value="hints"
          @update:model-value="update('hints', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { foodBrowserProps, FoodBrowserSettings, FoodSearchHints, useBasePrompt } from '../partials';

const props = defineProps({
  ...foodBrowserProps,
  allowBrowsing: {
    type: Boolean as PropType<Prompts['food-search-prompt']['allowBrowsing']>,
    required: true,
  },
  dualLanguage: {
    type: Boolean as PropType<Prompts['food-search-prompt']['dualLanguage']>,
    required: true,
  },
  hints: {
    type: Array as PropType<Prompts['food-search-prompt']['hints']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
