<template>
  <select-resource
    v-model="step.unit"
    clearable
    :error-messages="errors.get(`${index}.steps.${stepIndex}.unit*`)"
    item-id="code"
    :label="$t('locales.standard-units._')"
    multiple
    :name="`${index}.steps.${stepIndex}.unit`"
    :query="{ localeId }"
    resource="standard-units"
    :title="$t('locales.standard-units.title')"
  />
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';

import { SelectResource } from '@intake24/admin/components/dialogs';

import { createStepProps } from './step';

const props = defineProps(createStepProps<'lookup-unit'>());

const emit = defineEmits(['update:modelValue']);

const step = useVModel(props, 'modelValue', emit, { passive: true, deep: true });
</script>

<style lang="scss">
</style>
