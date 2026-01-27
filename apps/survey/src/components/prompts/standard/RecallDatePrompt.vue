<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-card-text class="pt-2">
      <v-date-picker
        v-model="state"
        full-width
        :landscape="!$vuetify.display.mobile"
        v-bind="datePickerProps"
      />
    </v-card-text>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { usePromptUtils } from '@intake24/survey/composables';

import { CardLayout } from '../layouts';
import { Next, useDatePicker } from '../partials';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'recall-date-prompt'>(),
  modelValue: {
    type: String as PropType<string | null>,
    default: null,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action } = usePromptUtils(props, { emit });
const { datePickerProps, isValid, state } = useDatePicker(props, { emit });
</script>

<style lang="scss" scoped></style>
