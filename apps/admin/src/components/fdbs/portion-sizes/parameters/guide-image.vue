<template>
  <v-row>
    <v-col cols="12">
      <select-resource
        v-model="parameters.guideImageId"
        item-name="id"
        :label="$t('fdbs.portionSizes.methods.guide-image._')"
        name="guide-image-id"
        :readonly
        resource="guide-images"
      />
    </v-col>
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
import { SelectResource } from '@intake24/admin/components/dialogs';
import type { PortionSizeParameters } from '@intake24/common/surveys';
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
