<template>
  <v-sheet class="mb-4">
    {{ translate(step.description) }}
  </v-sheet>
  <v-radio-group
    hide-details="auto"
    :model-value="modelValue.option"
    @update:model-value="update('option', $event)"
  >
    <v-radio
      v-for="option in localeOptions"
      :key="typeof option.value === 'string' ? option.value : JSON.stringify(option.value)"
      class="my-1"
      :disabled
      :label="option.label"
      :value="option.value"
    />
  </v-radio-group>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { useI18n } from '@intake24/ui';

import { createStepProps, useStep } from './use-step';

defineOptions({ inheritAttrs: false });
const props = defineProps(createStepProps<'coefficient' | 'condition' | 'lookup-resource'>());
const emit = defineEmits(['update:modelValue']);

const { i18n: { locale }, translate } = useI18n();
const { update } = useStep(props, { emit });

const localeOptions = computed(() => props.step.options[locale.value] ?? props.step.options.en);
</script>

<style lang="scss">
</style>
