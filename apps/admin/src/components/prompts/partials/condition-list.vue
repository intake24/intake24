<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t(`survey-schemes.prompts.${prompt}.filter`) }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        rounded
        :title="$t('survey-schemes.conditions.add')"
        @click="add"
      >
        <v-icon icon="$add" start />
        {{ $t('survey-schemes.conditions.add') }}
      </v-btn>
    </v-toolbar>
    <v-card-text v-if="conditions.length" class="px-0 d-flex flex-column ga-2">
      <div
        v-for="(condition, idx) in conditions" :key="idx"
        class="d-flex flex-row ga-4 justify-space-between align-center"
      >
        <condition-item v-model="conditions[idx]" class="flex-grow-1" />
        <v-btn
          color="error"
          icon="$delete"
          variant="text"
          @click="remove(idx)"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import { getConditionDefaults, getDefaultConditionProperty } from '@intake24/common/prompts';
import type { Condition } from '@intake24/common/prompts';
import { copy } from '@intake24/common/util';
import ConditionItem from './condition-item.vue';

const props = defineProps({
  modelValue: {
    type: Array as PropType<Condition[]>,
    required: true,
  },
  prompt: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const conditions = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

function add() {
  conditions.value.push(
    copy({ ...getConditionDefaults('food', getDefaultConditionProperty('food')) }),
  );
}
function remove(idx: number) {
  conditions.value.splice(idx, 1);
}
</script>

<style lang="scss" scoped></style>
