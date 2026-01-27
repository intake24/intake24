<template>
  <v-row>
    <v-col cols="12">
      <v-switch
        v-model="parameters.labels"
        :label="$t('fdbs.portionSizes.labels')"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PortionSizeParameters } from '@intake24/common/surveys';

import { useParameters } from './use-parameters';

defineOptions({ name: 'MilkOnCerealParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['milk-on-cereal']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { parameters } = useParameters<'milk-on-cereal'>(props, { emit });
</script>
