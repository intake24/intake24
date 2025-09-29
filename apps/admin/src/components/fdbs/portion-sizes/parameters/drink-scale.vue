<template>
  <v-row>
    <v-col cols="12">
      <select-resource
        v-model="parameters.drinkwareId"
        item-name="description"
        :label="$t('fdbs.portionSizes.methods.drink-scale.drinkwareSet')"
        name="drinkwareSetId"
        :readonly
        resource="drinkware-sets"
      />
    </v-col>
    <v-col cols="12">
      <v-slider
        v-model="parameters.initialFillLevel"
        class="mt-5"
        :label="$t('fdbs.portionSizes.methods.drink-scale.initialLevel')"
        :max="1"
        :min="0"
        :readonly
        :step="0.05"
        thumb-label="always"
      />
    </v-col>
    <v-col cols="12">
      <v-switch
        v-model="parameters.skipFillLevel"
        :label="$t('fdbs.portionSizes.methods.drink-scale.skipFillLevelPrompt')"
      />
    </v-col>
    <v-col cols="12">
      <v-switch
        v-model="parameters.labels"
        :label="$t('fdbs.portionSizes.labels')"
      />
    </v-col>
    <v-col cols="12">
      <v-switch
        v-model="parameters.multiple"
        :label="$t('fdbs.portionSizes.multiple')"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { SelectResource } from '@intake24/admin/components/dialogs';
import type { PortionSizeParameters } from '@intake24/common/surveys';
import { useParameters } from './use-parameters';

defineOptions({ name: 'DrinkScaleParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['drink-scale']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:modelValue']);

const { parameters } = useParameters<'drink-scale'>(props, { emit });
</script>
