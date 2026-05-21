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
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import { computed } from 'vue';

import { resources as resourcesList } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/ui';

import { createStepProps } from './step';

const props = defineProps(createStepProps<'select-entity'>());

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();

const step = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

const resources = computed(() => resourcesList.map(value => ({ title: t(`fdbs.${value}._`), value })));
</script>

<style lang="scss">
</style>
