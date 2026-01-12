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
          {{ $t(`prompts.${type}.sizes.label`) }}
          <template #actions>
            <expansion-panel-actions :valid="sizeValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex flex-column">
            <v-radio-group
              v-model="state.portionSize.size"
              hide-details="auto"
              @update:model-value="confirmType('size', false)"
            >
              <v-radio
                v-for="option in sizeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </v-radio-group>
            <v-btn
              :block="$vuetify.display.mobile"
              class="align-self-stretch align-self-md-start mt-6"
              color="primary"
              :disabled="!state.portionSize.size"
              @click="confirmType('size', true)"
            >
              {{ $t('common.action.continue') }}
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!sizeValid">
        <v-expansion-panel-title>
          {{ $t(`prompts.${type}.crusts.label`) }}
          <template #actions>
            <expansion-panel-actions :valid="crustValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex flex-column gr-4">
            <v-radio-group
              v-model="state.portionSize.crust"
              hide-details="auto"
              @update:model-value="confirmType('crust', false)"
            >
              <v-radio
                v-for="option in crustOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </v-radio-group>
            <v-btn
              :block="$vuetify.display.mobile"
              class="align-self-stretch align-self-md-start"
              color="primary"
              :disabled="!state.portionSize.crust"
              @click="confirmType('crust', true)"
            >
              {{ $t('common.action.continue') }}
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!crustValid">
        <v-expansion-panel-title>
          {{ $t(`prompts.${type}.units.label`) }}
          <template #actions>
            <expansion-panel-actions :valid="unitValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-item-group
            v-model="state.portionSize.unit"
            class="d-flex flex-row gc-2"
            :mandatory="!!state.portionSize.unit"
          >
            <v-container>
              <v-row>
                <v-col v-for="unit in unitOptions" :key="unit.value" cols="6">
                  <v-item v-slot="{ isSelected, toggle }" :value="unit.value">
                    <v-hover v-slot="{ isHovering }">
                      <v-card
                        class="d-flex flex-column gr-5 align-stretch justify-center pa-5 text-center rounded-xxl"
                        :color="isSelected || isHovering ? 'ternary' : ''"
                        flat
                        @click="
                          () => {
                            toggle && toggle();
                            confirmType('unit', true);
                          }
                        "
                      >
                        <span class="text-center">
                          <component
                            :is="`pizza-${unit.value}`"
                            class="pizza-unit__svg"
                          />
                        </span>
                        <span class="font-weight-bold text-uppercase">
                          {{ $t(`prompts.${type}.units.${unit.value}`) }}
                        </span>
                      </v-card>
                    </v-hover>
                  </v-item>
                </v-col>
              </v-row>
            </v-container>
          </v-item-group>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!unitValid">
        <v-expansion-panel-title>
          {{ $t(`prompts.${type}.quantity.${state.portionSize.unit ?? 'slice'}`) }}
          <template #actions>
            <expansion-panel-actions :valid="quantityValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-container>
            <v-row>
              <v-col class="d-none d-sm-flex justify-center align-center" cols="6">
                <component
                  :is="`pizza-${state.portionSize.unit}`"
                  class="pizza-unit__svg"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <quantity-card
                  v-model="state.portionSize.quantity"
                  @update:confirmed="confirmType('quantity', $event)"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
// @ts-expect-error - virtual types
import PizzaSlice from 'virtual:icons/fluent/food-pizza-24-filled';
// @ts-expect-error - virtual types
import PizzaWhole from 'virtual:icons/game-icons/full-pizza';
import { computed, ref } from 'vue';
import { pizzaCrusts, pizzaSizes, pizzaUnits } from '@intake24/common/surveys';
import { copy } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';
import { BaseLayout } from '../layouts';
import { Next, QuantityCard, usePanel, usePortionSizeMethod } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

defineOptions({
  components: { PizzaSlice, PizzaWhole },
});

const props = defineProps({
  ...createPortionPromptProps<'pizza-v2-prompt'>(),
});

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { t } } = useI18n();
const { action, type } = usePromptUtils(props, { emit });
const { conversionFactor, psmValid } = usePortionSizeMethod<'pizza-v2'>(props);
const { foodName } = useFoodUtils(props);

const baseWeight = 198;

const pizzaDefs = {
  personal: { slices: 4, multiplier: 1 },
  small: { slices: 6, multiplier: 2 },
  medium: { slices: 8, multiplier: 3 },
  large: { slices: 10, multiplier: 4 },
  xxl: { slices: 12, multiplier: 6 },
};

const crustDefs = { classic: 1, 'italian-thin': 0.8, stuffed: 1.2 };

const state = ref(copy(props.modelValue));

const sizeValid = computed(() => state.value.confirmed.size);
const crustValid = computed(() => state.value.confirmed.crust);
const unitValid = computed(() => state.value.confirmed.unit);
const quantityValid = computed(() => state.value.confirmed.quantity);
const validConditions = computed(() => [
  psmValid.value,
  sizeValid.value,
  crustValid.value,
  unitValid.value,
  quantityValid.value,
]);
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, validConditions);

const sizeOptions = computed(() =>
  pizzaSizes.map(value => ({
    label: t(`prompts.${type.value}.sizes.${value}`),
    value,
  })),
);

const crustOptions = computed(() =>
  pizzaCrusts.map(value => ({
    label: t(`prompts.${type.value}.crusts.${value}`),
    value,
  })),
);

const unitOptions = computed(() =>
  pizzaUnits.map(value => ({
    label: t(`prompts.${type.value}.units.${value}`),
    value,
  })),
);

function update() {
  const { size, crust, unit, quantity } = state.value.portionSize;
  if ([size, crust, unit, quantity].every(item => item)) {
    state.value.portionSize.servingWeight
      = ((baseWeight * pizzaDefs[size!].multiplier * crustDefs[crust!])
        / (unit === 'slice' ? pizzaDefs[size!].slices : 1))
      * quantity
      * conversionFactor.value;
  }

  emit('update:modelValue', state.value);
}

function confirmType(type: 'size' | 'crust' | 'unit' | 'quantity', value: boolean) {
  state.value.confirmed[type] = value;
  updatePanel();
  update();
}
</script>

<style lang="scss" scoped>
.pizza-unit__svg {
  height: auto;
  width: 100%;
  max-width: 150px;
}
</style>
