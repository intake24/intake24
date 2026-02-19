<template>
  <v-sheet class="mb-4">
    {{ translate(step.description) }}
  </v-sheet>
  <v-item-group
    class="d-flex flex-row gc-2"
    :mandatory="!!modelValue.option"
    :model-value="modelValue.option"
    @update:model-value="update('option', $event)"
  >
    <v-container>
      <v-row justify="center">
        <v-col v-for="unit in units" :key="unit.name" cols="6">
          <v-item v-slot="{ isSelected, toggle }" :value="unit">
            <v-hover v-slot="{ isHovering }">
              <v-card
                class="d-flex flex-column gr-5 align-stretch justify-center pa-5 text-center rounded-xxl"
                :color="isSelected || isHovering ? 'ternary' : ''"
                :disabled
                flat
                @click="
                  () => {
                    toggle?.();
                    update('option', unit);
                  }
                "
              >
                <span class="text-center">
                  <standard-unit-icon :icon="unit.name" />
                </span>
                <span class="font-weight-bold text-uppercase">
                  {{ getStandardUnitEstimateIn(unit) }}
                </span>
              </v-card>
            </v-hover>
          </v-item>
        </v-col>
      </v-row>
    </v-container>
  </v-item-group>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { StandardUnit } from '@intake24/common/surveys';

import { toRefs } from 'vue';

import { useI18n } from '@intake24/ui/i18n';

import { StandardUnitIcon, useStandardUnits } from '../../partials';
import { createStepProps, useStep } from './use-step';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  ...createStepProps<'lookup-unit'>(),
  units: {
    type: Array as PropType<StandardUnit[]>,
    default: () => ([]),
  },
});
const emit = defineEmits(['update:modelValue']);

const { translate } = useI18n();
const { update } = useStep(props, { emit });

const { units } = toRefs(props);
const { getStandardUnitEstimateIn } = useStandardUnits({ units });
</script>

<style lang="scss">
</style>
