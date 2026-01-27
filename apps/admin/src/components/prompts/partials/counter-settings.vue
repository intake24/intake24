<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-icon end icon="fas fa-calculator" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.counter.title') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="modelValue.current"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.counter.current')"
              name="current"
              :rules="isNumber"
              variant="outlined"
            />
            <v-text-field
              v-model.number="modelValue.min"
              class="mt-4"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.counter.min')"
              name="min"
              :rules="isNumber"
              variant="outlined"
            />
            <v-text-field
              v-model.number="modelValue.max"
              class="mt-4"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.counter.max')"
              name="max"
              :rules="isNumber"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="modelValue.strategy"
              hide-details="auto"
              :items="strategies"
              :label="$t('survey-schemes.prompts.multiple.strategy')"
              prepend-inner-icon="fas fa-chess-pawn"
            />
            <v-switch
              v-model="modelValue.confirm"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.counter.confirm')"
            />
            <v-switch
              v-model="modelValue.whole"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.counter.whole')"
            />
            <v-switch
              v-model="modelValue.fraction"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.counter.fraction')"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Counter } from '@intake24/common/prompts';

import { useVModel } from '@vueuse/core';
import { computed } from 'vue';

import { useI18n } from '@intake24/ui';

const props = defineProps({
  modelValue: {
    type: Object as PropType<Counter>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();

const modelValue = useVModel(props, 'modelValue', emit, { deep: true, passive: true });

const isNumber = computed(() => [
  (value: string | null): boolean | string =>
    !Number.isNaN(value) || 'Value needs to be a number.',
]);

const strategies = ([true, null] as const).map(value => ({
  value,
  title: t(`survey-schemes.prompts.multiple.${value}`),
}));
</script>

<style lang="scss" scoped></style>
