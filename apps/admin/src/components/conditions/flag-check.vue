<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="currentValue.flagId"
        hide-details="auto"
        :label="$t('survey-schemes.conditions.flag.id')"
        variant="outlined"
      />
    </v-col>
    <v-col align-self="center" cols="12" md="6">
      <v-checkbox-btn
        v-model="currentValue.value"
        :label="$t('survey-schemes.conditions.showIfSet')"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FlagPropertyCheck } from '@intake24/common/prompts';

import { useCheck } from './use-check';

const props = defineProps({
  modelValue: {
    type: Object as PropType<FlagPropertyCheck>,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const { currentValue } = useCheck(props, { emit });
</script>

<style lang="scss" scoped></style>
