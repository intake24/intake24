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
          <i18n-t :keypath="`prompts.${type}.quantity`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="quantityValid">
              <quantity-badge
                v-if="prompt.badges"
                :amount="state.portionSize.quantity ?? undefined"
                :valid="quantityValid"
              />
            </expansion-panel-actions>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="state.portionSize.quantity"
                hide-details="auto"
                :label="$t('prompts.quantity._')"
                name="quantity"
                prepend-inner-icon="fas fa-weight-scale"
                :rules="rules"
                @update:model-value="update"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import { isNumber } from 'lodash-es';
import { computed, ref } from 'vue';
import { copy } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';
import { BaseLayout } from '../layouts';
import { Next, QuantityBadge, usePortionSizeMethod } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps({
  ...createPortionPromptProps<'direct-weight-prompt'>(),
  max: {
    type: Number,
    default: 10000,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action, type } = usePromptUtils(props, { emit });
const { conversionFactor, psmValid } = usePortionSizeMethod<'direct-weight'>(props);
const { foodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));

const validateInput = (value: any) => isNumber(value) && value > 0 && value < props.max;

const rules = computed(() => [
  (value: any): boolean | string => validateInput(value),
]);
const quantityValid = computed(() => validateInput(state.value.portionSize.quantity));
const validConditions = computed(() => [psmValid.value, quantityValid.value]);
const isValid = computed(() => validConditions.value.every(condition => condition));

function update() {
  const { portionSize: { quantity } } = state.value;

  state.value.portionSize.servingWeight = isNumber(quantity) ? quantity * conversionFactor.value : null;

  emit('update:modelValue', state.value);
};
</script>

<style lang="scss" scoped></style>
