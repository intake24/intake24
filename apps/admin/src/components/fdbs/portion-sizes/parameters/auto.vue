<template>
  <div class="d-flex flex-column ga-4">
    <v-select
      v-model="parameters.mode"
      :items="modes"
      :label="$t('fdbs.portionSizes.methods.auto.modes._')"
      name="auto.mode"
    />
    <v-number-input
      v-model="parameters.value"
      :label="$t('fdbs.portionSizes.methods.auto.value')"
      name="auto.value"
      :precision="2"
      prepend-inner-icon="fas fa-weight-scale"
    />
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PortionSizeParameters } from '@intake24/common/surveys';

import { autoPsmModes } from '@intake24/common/surveys';
import { useI18n } from '@intake24/ui';

import { useParameters } from './use-parameters';

defineOptions({ name: 'AutoParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['auto']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();

const { parameters } = useParameters<'auto'>(props, { emit });

const modes = autoPsmModes.map(value => ({
  value,
  title: t(`fdbs.portionSizes.methods.auto.modes.${value}`),
}));
</script>
