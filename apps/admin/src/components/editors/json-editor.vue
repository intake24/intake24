<template>
  <json-editor-vue
    v-bind="{
      readOnly,
      stringified: false,
      modelValue,
      class: 'json-editor',
    }" @update:model-value="input"
  />
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';

const props = defineProps({
  modelValue: {
    type: [Array, Object],
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const JsonEditorVue = defineAsyncComponent(() => import('json-editor-vue'));

function input(value: string | object) {
  if (!value && props.required)
    return;

  emit('update:modelValue', value);
}
</script>
