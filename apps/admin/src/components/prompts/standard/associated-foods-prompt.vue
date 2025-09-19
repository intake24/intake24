<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.associated-foods-prompt.multiple')"
          :model-value="multiple"
          @update:model-value="update('multiple', $event)"
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
  hints: {
    type: Array as PropType<Prompts['associated-foods-prompt']['hints']>,
    required: true,
  },
  multiple: {
    type: Boolean as PropType<Prompts['associated-foods-prompt']['multiple']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
