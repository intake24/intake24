<template>
  <card-unit v-bind="{ unit: modelValue.unit }" @update:unit="update('unit', $event)" />
  <card-thresholds
    :thresholds="{ high: modelValue.high, low: modelValue.low }"
    @update:high="update('high', $event)"
    @update:low="update('low', $event)"
  />
  <v-tabs-window-item value="json">
    <json-editor v-bind="{ modelValue }" @update:model-value="$emit('update:modelValue', $event)" />
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { JsonEditor } from '@intake24/admin/components/editors';
import type { FiveADayCard } from '@intake24/common/feedback';

import { CardThresholds, CardUnit } from '../partials';

defineOptions({ name: 'FiveADayCard' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<FiveADayCard>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

function update(field: string, value: any) {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
}
</script>
