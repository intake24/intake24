<template>
  <v-row>
    <v-col cols="12">
      <v-checkbox-btn
        v-model="currentValue.value"
        :label="$t('survey-schemes.conditions.showIfTrue')"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { BooleanPropertyCheck } from '@intake24/common/prompts';

import { useCheck } from './use-check';

const props = defineProps({
  modelValue: {
    type: Object as PropType<BooleanPropertyCheck>,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const { currentValue } = useCheck(props, { emit });
</script>

<style lang="scss" scoped></style>
