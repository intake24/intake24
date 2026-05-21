<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-select
        v-model="currentValue.completionState"
        hide-details="auto"
        item-value="state"
        :items="completionStateSelectList"
        :label="$t('survey-schemes.conditions.property.foodCompletion')"
        variant="outlined"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FoodCompletionPropertyCheck } from '@intake24/common/prompts';

import { foodCompletionStateOptions } from '@intake24/common/prompts';
import { useI18n } from '@intake24/ui';

import { useCheck } from './use-check';

const props = defineProps({
  modelValue: {
    type: Object as PropType<FoodCompletionPropertyCheck>,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const { i18n } = useI18n();

const { currentValue } = useCheck(props, { emit });

const completionStateSelectList = foodCompletionStateOptions.map(state => ({ state, title: i18n.t(`survey-schemes.conditions.foodCompletion.${state}`) }));
</script>

<style lang="scss" scoped></style>
