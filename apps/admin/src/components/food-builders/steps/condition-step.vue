<template>
  <language-selector
    v-model="step.options"
    border
    :default="[]"
    :label="$t('locales.food-builders.steps.types.condition')"
    required
  >
    <template v-for="lang in Object.keys(step.options)" :key="lang" #[`lang.${lang}`]>
      <options-list
        v-model:options="step.options[lang]"
        :default="[]"
      >
        <template v-for="(opt, idx) in step.options[lang]" :key="opt.id" #[`value.${idx}`]>
          <condition-list v-model="step.options[lang][idx].value" />
        </template>
      </options-list>
    </template>
  </language-selector>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';

import { ConditionList } from '../../conditions';
import { LanguageSelector } from '../../forms';
import { OptionsList } from '../../lists';
import { createStepProps } from './step';

const props = defineProps(createStepProps<'condition'>());

const emit = defineEmits(['update:modelValue']);

const step = useVModel(props, 'modelValue', emit, { passive: true, deep: true });
</script>

<style lang="scss">
</style>
