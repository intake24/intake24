<template>
  <v-radio-group
    hide-details="auto"
    :model-value="modelValue.option"
    @update:model-value="update"
  >
    <v-radio
      v-for="option in localeOptions"
      :key="typeof option.value === 'string' ? option.value : JSON.stringify(option.value)"
      class="my-1"
      :label="option.label"
      :value="option.value"
    />
  </v-radio-group>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FoodBuilderCoefficientStepState, FoodBuilderConditionStepState } from '@intake24/common/prompts';
import type { CoefficientStep, ConditionStep } from '@intake24/common/types/http/admin';

import { computed } from 'vue';

import { useI18n } from '@intake24/ui';

type RadioListStep = CoefficientStep | ConditionStep;
type RadioListStepState = FoodBuilderCoefficientStepState | FoodBuilderConditionStepState;

const props = defineProps({
  step: {
    type: Object as PropType<RadioListStep>,
    required: true,
  },
  modelValue: {
    type: [String, Object] as PropType<RadioListStepState>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n: { locale } } = useI18n();

const localeOptions = computed(() => props.step.options[locale.value] ?? props.step.options.en);

function update(value: RadioListStepState['option'] | null) {
  console.log('step update emit', value);
  emit('update:modelValue', { ...props.modelValue, option: value });
}
</script>

<style lang="scss">
</style>
