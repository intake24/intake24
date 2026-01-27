<template>
  <v-expansion-panel v-bind="$attrs">
    <v-expansion-panel-title>
      <i18n-t keypath="prompts.linkedAmount.label" tag="span">
        <template #unit>
          {{ linkedQuantityUnit }}
        </template>
        <template #food>
          <span class="font-weight-medium">{{ foodName }}</span>
        </template>
        <template #quantity>
          <span class="font-weight-medium">{{ round(parentQuantity, 2) }}</span>
        </template>
      </i18n-t>
      <template #actions>
        <expansion-panel-actions :valid="confirmed" />
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <quantity-card
        :confirmed="confirmed"
        :max="parentQuantity"
        :model-value="modelValue"
        :show-all="!!linkedParent.categories.length"
        @update:confirmed="updateConfirmed"
        @update:model-value="updateQuantity"
      />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { LinkedParent } from '../../handlers/composables';
import type { Prompt } from '@intake24/common/prompts';
import type { EncodedFood, MissingFood } from '@intake24/common/surveys';

import { computed, onMounted } from 'vue';

import { round } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import QuantityCard from './QuantityCard.vue';
import { useStandardUnits } from './use-standard-units';

const props = defineProps({
  confirmed: {
    type: Boolean,
    required: true,
  },
  food: {
    type: Object as PropType<EncodedFood | MissingFood>,
    required: true,
  },
  linkedParent: {
    type: Object as PropType<LinkedParent>,
    required: true,
  },
  prompt: {
    type: Object as PropType<Prompt>,
    required: true,
  },
  modelValue: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'update:confirmed']);

const { foodName } = useFoodUtils(props);
const { i18n: { t }, translate } = useI18n();
const { standardUnitRefs, resolveStandardUnits } = useStandardUnits();

const linkedQuantityUnit = computed(() => {
  const unit = props.linkedParent.categories[0]?.unit;
  if (!unit || !standardUnitRefs.value[unit])
    return t('prompts.linkedAmount.unit');

  return translate(standardUnitRefs.value[unit].howMany, {
    path: 'prompts.linkedAmount.unit',
  });
});

const parentQuantity = computed(() =>
  props.linkedParent.food?.portionSize?.method === 'guide-image'
    ? props.linkedParent.food.portionSize.quantity
    : 1,
);

function updateQuantity(value: number) {
  emit('update:modelValue', value);
}

function updateConfirmed(value: boolean) {
  emit('update:confirmed', value);
}

onMounted(async () => {
  if (!props.linkedParent.categories.length)
    return;

  const names = props.linkedParent.categories.map(({ unit }) => unit).filter(Boolean) as string[];
  await resolveStandardUnits(names);
});
</script>

<style lang="scss" scoped></style>
