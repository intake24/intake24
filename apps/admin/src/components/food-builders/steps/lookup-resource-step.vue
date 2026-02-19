<template>
  <v-select
    v-model="step.resource"
    :error-messages="errors.get(`${index}.steps.${stepIndex}.resource`)"
    :items="resources"
    :label="$t(`fdbs.entity`)"
    :name="`${index}.steps.${stepIndex}.resource`"
    @update:model-value="errors.clear(`${index}.steps.${stepIndex}.resource`)"
  >
    <template #item="{ props, item }">
      <v-list-item v-bind="props" :title="item.value">
        <template #prepend>
          <v-icon :icon="`$${item.value}`" />
        </template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <v-icon :icon="`$${item.value}`" start />
      {{ item.value }}
    </template>
  </v-select>
  <language-selector
    v-model="step.options"
    border
    :default="[]"
    :label="$t(`fdbs.${step.resource}.code`)"
    required
  >
    <template v-for="lang in Object.keys(step.options)" :key="lang" #[`lang.${lang}`]>
      <options-list v-model:options="step.options[lang]">
        <template v-for="(opt, idx) in step.options[lang]" :key="opt.id" #[`value.${idx}`]>
          <select-resource
            v-model="step.options[lang][idx].value"
            item-id="code"
            :label="$t(`fdbs.${step.resource}.code`)"
            :query="{ localeId }"
            :resource="step.resource"
          >
            <template #title>
              {{ $t(`fdbs.${step.resource}.title`) }}
            </template>
            <template #item="{ item }">
              <v-list-item-title>{{ item.code }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.name }}</v-list-item-subtitle>
            </template>
          </select-resource>
        </template>
      </options-list>
    </template>
  </language-selector>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import { computed } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { resources as resourcesList } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/ui';

import { LanguageSelector } from '../../forms';
import { OptionsList } from '../../lists';
import { createStepProps } from './step';

const props = defineProps(createStepProps<'lookup-resource'>());

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();

const step = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

const resources = computed(() => resourcesList.map(value => ({ title: t(`fdbs.${value}._`), value })));
</script>

<style lang="scss">
</style>
