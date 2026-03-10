<template>
  <div class="d-flex flex-column ga-4">
    <select-resource
      v-model="parameters.guideImageId"
      item-name="id"
      :label="$t('fdbs.portionSizes.methods.guide-image._')"
      name="guide-image-id"
      :readonly
      resource="guide-images"
    />
    <v-switch
      v-model="parameters.labels"
      :label="$t('fdbs.portionSizes.labels')"
      :readonly
    />
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PortionSizeParameters } from '@intake24/common/surveys';

import { SelectResource } from '@intake24/admin/components/dialogs';

import { useParameters } from './use-parameters';

defineOptions({ name: 'GuideImageParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['guide-image']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { parameters } = useParameters<'guide-image'>(props, { emit });
</script>
