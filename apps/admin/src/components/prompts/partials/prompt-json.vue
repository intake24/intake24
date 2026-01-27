<template>
  <v-tabs-window-item value="json">
    <json-editor
      :model-value
      required
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompt } from '@intake24/common/prompts';

import { JsonEditor } from '@intake24/admin/components/editors';

defineOptions({ name: 'PromptJson' });

defineProps({
  modelValue: {
    type: Object as PropType<Prompt>,
    required: true,
  },
});

defineEmits(['update:modelValue']);
</script>

<style lang="scss" scoped></style>
