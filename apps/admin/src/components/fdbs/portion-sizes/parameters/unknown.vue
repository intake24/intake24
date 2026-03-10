<template>
  <div class="d-flex flex-column ga-4">
    <v-number-input
      v-model="parameters.weight"
      :label="$t('fdbs.portionSizes.methods.unknown.weight')"
      name="unknown.weight"
      :precision="2"
      prepend-inner-icon="fas fa-weight-scale"
      :readonly
    />
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PortionSizeParameters } from '@intake24/common/surveys';

import { useParameters } from './use-parameters';

defineOptions({ name: 'UnknownParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['unknown']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { parameters } = useParameters<'unknown'>(props, { emit });
</script>
