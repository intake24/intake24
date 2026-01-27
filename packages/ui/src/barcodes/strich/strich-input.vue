<template>
  <v-text-field ref="inputRef" v-model="barcode" v-bind="{ name }">
    <template #append-inner>
      <v-icon @click.stop.prevent="open">
        fas fa-barcode
      </v-icon>
      <strich-reader
        v-model:dialog="dialog"
        v-bind="{ options }"
        @detected="detected"
      />
    </template>
  </v-text-field>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { StrichScanner } from '@intake24/common/barcodes';

import { useVModel } from '@vueuse/core';
import { defineComponent, ref, useTemplateRef } from 'vue';

import StrichReader from './strich-reader.vue';

const props = defineProps({
  modelValue: {
    type: String as PropType<string | null>,
    default: '',
  },
  name: {
    type: String,
    default: 'barcode',
  },
  options: {
    type: Object as PropType<StrichScanner>,
  },
});

const emit = defineEmits<{
  (e: 'detected', value: string): void;
  (e: 'update:modelValue', value: string | null): void;
}>();

const barcode = useVModel(props, 'modelValue', emit);

const dialog = ref(false);
const inputRef = useTemplateRef('inputRef');

function open(event: Event) {
  event.preventDefault();
  inputRef.value?.blur();

  dialog.value = true;
}

function detected(value: string) {
  barcode.value = value;
  emit('detected', value);
}
</script>

<script lang="ts">
export default defineComponent({
  name: 'StrichInput',
});
</script>

<style lang="scss"></style>
