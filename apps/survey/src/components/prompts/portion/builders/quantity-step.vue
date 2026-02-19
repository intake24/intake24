<template>
  <i18n-t
    v-if="unit"
    keypath="prompts.standardPortion.howMany._"
    tag="span"
  >
    <template #unit>
      {{ getStandardUnitHowMany(unit) }}
    </template>
  </i18n-t>
  <v-container v-if="unit">
    <v-row>
      <v-col class="d-none d-sm-flex justify-center align-center" cols="6">
        <standard-unit-icon :icon="unit.name" />
      </v-col>
      <v-col cols="12" sm="6">
        <quantity-card
          :confirmed="modelValue.confirmed"
          :model-value="modelValue.quantity"
          @update:confirmed="update('confirmed', $event)"
          @update:model-value="update('quantity', $event)"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { QuantityCard, StandardUnitIcon, useStandardUnits } from '../../partials';
import { createStepProps, useStep } from './use-step';

defineOptions({ inheritAttrs: false });
const props = defineProps(createStepProps<'quantity'>());
const emit = defineEmits(['update:modelValue']);

const { getStepState, update } = useStep(props, { emit });

const unit = computed(() => getStepState('lookup-unit')?.option);
const units = computed(() => unit.value ? [unit.value] : []);
const { getStandardUnitHowMany } = useStandardUnits({ units });
</script>

<style lang="scss">
</style>
