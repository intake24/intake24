<template>
  <language-selector
    v-model="step.options"
    border
    :default="[]"
    :label="$t('locales.food-builders.steps.coefficient')"
    required
  >
    <template v-for="lang in Object.keys(step.options)" :key="lang" #[`lang.${lang}`]>
      <options-list
        v-model:options="step.options[lang]"
        numeric
        :rules
      />
    </template>
  </language-selector>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';

import { LanguageSelector } from '../../forms';
import { OptionsList } from '../../lists';
import { createStepProps } from './step';

const props = defineProps(createStepProps<'coefficient'>());

const emit = defineEmits(['update:modelValue']);

const step = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

const rules = [
  (value: any): boolean | string => {
    const msg = 'Value must be greater than 0';
    const number = Number.parseFloat(value);
    if (Number.isNaN(number))
      return msg;

    return number > 0 || msg;
  },
];
</script>

<style lang="scss">
</style>
