<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-card-text class="pt-2">
      <v-form @submit.prevent="action('next')">
        <v-slider
          v-model="state"
          class="quantity-slider__slider px-8"
          color="secondary"
          :max="prompt.slider.max.value ?? undefined"
          :min="prompt.slider.min.value ?? undefined"
          :step="prompt.slider.step"
          :thumb-label="prompt.slider.current ? `always` : false"
          :thumb-size="25"
          track-color="primary"
          track-size="12"
        >
          <template #thumb-label="{ modelValue: thumbValue }">
            <div class="d-flex flex-column align-center">
              <span class="text-h5 font-weight-bold">{{ thumbValue }}</span>
              <span v-if="prompt.slider.current.label" class="text-h6 font-weight-bold">
                {{ translate(prompt.slider.current.label) }}
              </span>
            </div>
          </template>
          <template #prepend>
            <span v-if="prompt.slider.min.label" class="text-h6 font-weight-bold">
              {{ translate(prompt.slider.min.label) }}
            </span>
          </template>
          <template #append>
            <span v-if="prompt.slider.max.label" class="text-h6 font-weight-bold">
              {{ translate(prompt.slider.max.label) }}
            </span>
          </template>
        </v-slider>
      </v-form>
    </v-card-text>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')">
        {{ promptI18n.confirm }}
      </next>
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { MealState } from '@intake24/common/surveys';

import { computed, onMounted } from 'vue';

import { usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import { CardLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'meal-duration-prompt'>(),
  meal: {
    type: Object as PropType<MealState>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { translate } = useI18n();
const { action, translatePrompt } = usePromptUtils(props, { emit });

const state = defineModel('modelValue', { type: Number });

const isValid = computed(() => state.value !== null);
const promptI18n = computed(() => translatePrompt(['minutes', 'confirm']));

onMounted(() => {
  if (typeof state.value === 'undefined')
    state.value = props.prompt.slider.current.value ?? props.prompt.slider.min.value ?? 0;
});
</script>

<style lang="scss"></style>
