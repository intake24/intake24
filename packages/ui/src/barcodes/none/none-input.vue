<template>
  <v-text-field v-bind="{ name }" v-model="barcode" />
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { NoneScanner } from '@intake24/common/barcodes';

import { useVModel } from '@vueuse/core';
import { defineComponent } from 'vue';

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
    type: Object as PropType<NoneScanner>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const barcode = useVModel(props, 'modelValue', emit);
</script>

<script lang="ts">
export default defineComponent({
  name: 'NoneInput',
});
</script>

<style lang="scss"></style>
