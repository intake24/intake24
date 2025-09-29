<template>
  <v-row>
    <v-col cols="12">
      <select-resource
        v-model="parameters.servingImageSet"
        item-name="description"
        :label="$t('fdbs.portionSizes.methods.as-served.servingImageSet')"
        name="serving-set-id"
        :readonly
        resource="as-served-sets"
      />
    </v-col>
    <v-col cols="12">
      <select-resource
        v-model="parameters.leftoversImageSet"
        clearable
        item-name="description"
        :label="$t('fdbs.portionSizes.methods.as-served.leftoverImageSet')"
        :readonly
        resource="as-served-sets"
      />
    </v-col>
    <v-col cols="12">
      <v-switch
        v-model="parameters.multiple"
        :label="$t('fdbs.portionSizes.multiple')"
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

defineOptions({ name: 'AsServedParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['as-served']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { parameters } = useParameters<'as-served'>(props, { emit });
</script>
