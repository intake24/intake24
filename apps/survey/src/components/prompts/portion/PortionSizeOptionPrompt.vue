<template>
  <card-layout v-bind="{ food, prompt, section, isValid }" @action="action">
    <portion-size-methods
      v-bind="{
        foodName,
        modelValue: modelValue.option,
        portionSizeMethods,
      }"
      @update:model-value="update"
    />
  </card-layout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';

import { CardLayout } from '../layouts';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps(createPortionPromptProps<'portion-size-option-prompt'>());

const emit = defineEmits(['action', 'update:modelValue']);

const { action } = usePromptUtils(props, { emit });
const { foodName } = useFoodUtils(props);
const isValid = computed(() => props.modelValue !== null);

function update(event?: number) {
  emit('update:modelValue', { option: event ?? null });

  if (!isValid.value)
    return;

  action('next');
};

onMounted(() => {
  if (!isValid.value && props.portionSizeMethods.length === 1) {
    update(0);
  }
});
</script>

<style lang="scss" scoped></style>
