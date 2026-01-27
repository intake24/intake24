<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-card-text class="pt-2">
      <v-card v-for="(food, idx) in state" :key="food.id" border class="mb-3">
        <v-card-text class="d-flex flex-column flex-sm-row justify-space-between gr-2">
          <div class="d-flex align-center">
            <v-btn class="bg-secondary font-weight-medium me-2" icon readonly size="x-small">
              {{ idx + 1 }}
            </v-btn>
            <span class="text-subtitle-1 font-weight-medium">{{ food.name }}</span>
          </div>
          <yes-no-toggle v-model="food.value" mandatory />
        </v-card-text>
      </v-card>
    </v-card-text>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PromptStates } from '@intake24/common/prompts';
import type { MealState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { YesNoToggle } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';

import { CardLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'ready-meal-prompt'>(),
  meal: {
    type: Object as PropType<MealState>,
    required: true,
  },
  modelValue: {
    type: Array as PropType<PromptStates['ready-meal-prompt']>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action } = usePromptUtils(props, { emit });

const state = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const isValid = computed(() => state.value.every(food => food.value !== undefined));
</script>

<style lang="scss" scoped></style>
