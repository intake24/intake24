<template>
  <v-tabs-window-item value="options">
    <v-row>
      <v-col cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.edit-meal-prompt.separateDrinks')"
          :model-value="separateDrinks"
          @update:model-value="update('separateDrinks', $event)"
        />
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.edit-meal-prompt.inputAutoFocus')"
          :model-value="inputAutoFocus"
          @update:model-value="update('inputAutoFocus', $event)"
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
import { FoodSearchHints, useBasePrompt } from '../partials';

const props = defineProps({
  hints: {
    type: Array as PropType<Prompts['edit-meal-prompt']['hints']>,
    required: true,
  },
  separateDrinks: {
    type: Boolean as PropType<Prompts['edit-meal-prompt']['separateDrinks']>,
    required: true,
  },
  inputAutoFocus: {
    type: Boolean as PropType<Prompts['edit-meal-prompt']['inputAutoFocus']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
