<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-switch
          v-model="step.multiple"
          :error-messages="errors.get(`${index}.steps.${stepIndex}.multiple`)"
          :label="$t('locales.food-builders.steps.multiple')"
          :name="`${index}.steps.${stepIndex}.multiple`"
          @update:model-value="errors.clear(`${index}.steps.${stepIndex}.multiple`)"
        />
        <v-switch
          v-model="step.required"
          :error-messages="errors.get(`${index}.steps.${stepIndex}.required`)"
          :label="$t('locales.food-builders.steps.required')"
          :name="`${index}.steps.${stepIndex}.required`"
          @update:model-value="errors.clear(`${index}.steps.${stepIndex}.required`)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <select-resource
          v-model.trim="step.categoryCode"
          :error-messages="errors.get(`${index}.steps.${stepIndex}.categoryCode`)"
          item-id="code"
          :label="$t('fdbs.categories.code')"
          :name="`${index}.steps.${stepIndex}.categoryCode`"
          :query="{ localeId }"
          resource="categories"
        >
          <template #title>
            {{ $t(`fdbs.categories.title`) }}
          </template>
          <template #item="{ item: resItem }">
            <v-list-item-title>{{ resItem.code }}</v-list-item-title>
            <v-list-item-subtitle>{{ resItem.name }}</v-list-item-subtitle>
          </template>
        </select-resource>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';

import { SelectResource } from '../../dialogs';
import { createStepProps } from './step';

const props = defineProps(createStepProps<'ingredient'>());

const emit = defineEmits(['update:modelValue']);

const step = useVModel(props, 'modelValue', emit, { passive: true, deep: true });
</script>

<style lang="scss">
</style>
