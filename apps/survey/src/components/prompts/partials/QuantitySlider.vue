<template>
  <div>
    <v-slider
      class="quantity-slider__slider align-center mb-4 px-2 px-sm-4"
      color="secondary"
      hide-details
      :label="$t('prompts.quantity._')"
      :max="max.value ?? undefined"
      :min="min.value ?? undefined"
      :model-value="modelValue"
      :step="step"
      :thumb-label="current ? `always` : false"
      :thumb-size="25"
      track-color="primary"
      track-size="12"
      @update:model-value="updateValue($event)"
    >
      <template #prepend>
        <v-icon color="secondary" size="large" :title="$t('prompts.quantity.less')" @click="decrement">
          fas fa-circle-minus
        </v-icon>
      </template>
      <template #append>
        <v-icon color="secondary" size="large" :title="$t('prompts.quantity.more')" @click="increment">
          fas fa-circle-plus
        </v-icon>
      </template>
      <template #thumb-label="{ modelValue: thumbValue }">
        <div class="d-flex flex-column align-center">
          <span class="text-h5 font-weight-bold">{{ thumbValue }}</span>
        </div>
      </template>
    </v-slider>
    <v-row v-if="confirm">
      <v-col cols="12" sm="auto">
        <v-btn :block="$vuetify.display.mobile" color="primary" @click="updateConfirmed(true)">
          {{ $t('common.action.continue') }}
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Slider } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'QuantitySlider',

  props: {
    confirm: {
      type: Boolean,
      default: true,
    },
    confirmed: {
      type: Boolean,
      default: true,
    },
    current: {
      type: Object as PropType<Slider['current']>,
      required: true,
    },
    min: {
      type: Object as PropType<Slider['min']>,
      required: true,
    },
    max: {
      type: Object as PropType<Slider['max']>,
      required: true,
    },
    step: {
      type: Number as PropType<Slider['step']>,
      required: true,
    },
    modelValue: {
      type: Number,
      default: 1,
    },
  },

  emits: ['update:modelValue', 'update:confirmed'],

  setup(props, { emit }) {
    const updateConfirmed = (value: boolean) => {
      emit('update:confirmed', value);
    };

    const updateValue = (value: number) => {
      emit('update:modelValue', value);

      if (props.confirmed)
        updateConfirmed(false);
    };

    const decrement = () => {
      updateValue(props.modelValue - props.step);
    };

    const increment = () => {
      updateValue(props.modelValue + props.step);
    };

    return {
      decrement,
      increment,
      updateConfirmed,
      updateValue,
    };
  },
});
</script>

<style lang="scss"></style>
