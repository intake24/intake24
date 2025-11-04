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
            <expansion-panel-actions :valid="!!state.portionSize.portionValue" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-radio-group
            v-model="state.portionSize.portionValue"
            hide-details="auto"
            :inline="prompt.orientation === 'row'"
            @update:model-value="updatePortion"
          >
            <v-radio v-for="option in localeOptions" :key="option.value" :value="option.value">
              <template #label>
                {{ option.label }}
                <quantity-badge
                  v-if="prompt.badges"
                  :amount="option.value * parentServing"
                  class="ms-2"
                  unit="ml"
                  :valid="state.portionSize.portionValue === option.value"
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
import { computed, ref } from 'vue';
import type { EncodedFood } from '@intake24/common/surveys';
import { copy } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';
import { BaseLayout } from '../layouts';
import { Next, QuantityBadge, usePanel, usePortionSizeMethod } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps({
  ...createPortionPromptProps<'parent-food-portion-prompt'>(),
  parentFood: {
    type: Object as PropType<EncodedFood>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { locale } } = useI18n();
const { action, type } = usePromptUtils(props, { emit });
const { parameters, psmValid } = usePortionSizeMethod<'parent-food-portion'>(props);
const { foodName, parentFoodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));

const category = computed(() => {
  const categories = Object.keys(parameters.value.options);
  return (
    props.parentFood.data.categories.find(category => categories.includes(category))
    ?? '_default'
  );
});

const localeOptions = computed(() =>
  (
    parameters.value.options[category.value][locale.value]
    ?? parameters.value.options[category.value].en
  )
    .map(item => ({ ...item, value: Number(item.value) }))
    .filter(({ value }) => !Number.isNaN(value)),
);
const parentServing = computed(() => props.parentFood.portionSize?.servingWeight ?? 0);
const portionValid = computed(() => state.value.portionSize.portionIndex !== null && state.value.portionSize.portionValue !== null);
const validConditions = computed(() => [psmValid.value, portionValid.value]);
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, validConditions);

function updatePortion(val: number | null) {
  state.value.portionSize.portionIndex = localeOptions.value.findIndex(option => option.value === val) ?? null;

  updatePanel();
  update();
}

function update() {
  emit('update:modelValue', state.value);
};
</script>

<style lang="scss" scoped></style>
