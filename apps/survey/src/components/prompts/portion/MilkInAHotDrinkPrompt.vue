<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="state.panel" :tile="$vuetify.display.mobile">
      <v-expansion-panel :readonly="portionSizeMethods.length === 1">
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.${type}.method`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="psmValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <portion-size-methods
            v-bind="{ foodName, modelValue: food.portionSizeMethodIndex, portionSizeMethods }"
            @update:model-value="action('changeMethod', $event)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.${type}.label`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
            <template #parentFood>
              <span class="font-weight-medium">{{ parentFoodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="!!state.portionSize.milkVolumePercentage" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-radio-group
            v-model="state.portionSize.milkVolumePercentage"
            hide-details="auto"
            :inline="prompt.orientation === 'row'"
            @update:model-value="updateMilk"
          >
            <v-radio v-for="option in localeOptions" :key="option.value" :value="option.value">
              <template #label>
                {{ option.label }}
                <quantity-badge
                  v-if="prompt.badges"
                  :amount="option.value * parentServing"
                  class="ms-2"
                  unit="ml"
                  :valid="state.portionSize.milkVolumePercentage === option.value"
                />
              </template>
            </v-radio>
          </v-radio-group>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { EncodedFood } from '@intake24/common/surveys';

import { computed, ref } from 'vue';

import { copy } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import { BaseLayout } from '../layouts';
import { Next, QuantityBadge, usePanel, usePortionSizeMethod } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps({
  ...createPortionPromptProps<'milk-in-a-hot-drink-prompt'>(),
  parentFood: {
    type: Object as PropType<EncodedFood>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { locale } } = useI18n();
const { action, type } = usePromptUtils(props, { emit });
const { parameters, psmValid } = usePortionSizeMethod<'milk-in-a-hot-drink'>(props);
const { foodName, parentFoodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));

const localeOptions = computed(() =>
  (parameters.value.options[locale.value] ?? parameters.value.options.en)
    .map(item => ({ ...item, value: Number(item.value) }))
    .filter(({ value }) => !Number.isNaN(value)),
);

const parentServing = computed(() => props.parentFood.portionSize?.servingWeight ?? 0);
const milkValid = computed(() => state.value.portionSize.milkPartIndex !== null && state.value.portionSize.milkVolumePercentage !== null);
const validConditions = computed(() => [psmValid.value, milkValid.value]);
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, validConditions);

function updateMilk(val: number | null) {
  state.value.portionSize.milkPartIndex = localeOptions.value.findIndex(option => option.value === val) ?? null;

  updatePanel();
  update();
}

function update() {
  emit('update:modelValue', state.value);
};
</script>

<style lang="scss" scoped></style>
