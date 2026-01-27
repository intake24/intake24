<template>
  <v-row class="ml-2" dense>
    <v-col cols="12" md="6">
      <v-switch
        hide-details="auto"
        :label="$t(`survey-schemes.prompts.${prompt}.filter`)"
        :model-value="!!condition"
        @update:model-value="toggle($event)"
      />
    </v-col>
  </v-row>
  <v-expand-transition>
    <condition-item
      v-if="condition"
      v-model="condition"
      border
      :objects="['meal', 'food']"
    />
  </v-expand-transition>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Condition } from '@intake24/common/prompts';

import { useVModel } from '@vueuse/core';

import { getConditionDefaults, getDefaultConditionProperty } from '@intake24/common/prompts';
import { copy } from '@intake24/common/util';

import ConditionItem from './condition-item.vue';

const props = defineProps({
  modelValue: {
    type: Object as PropType<Condition>,
  },
  prompt: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const condition = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

function toggle(enabled?: boolean | null) {
  if (!enabled) {
    condition.value = undefined;
    return;
  }

  condition.value = copy({ ...getConditionDefaults('food', getDefaultConditionProperty('food')) });
}
</script>

<style lang="scss" scoped></style>
