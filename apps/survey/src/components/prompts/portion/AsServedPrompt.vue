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
          <i18n-t :keypath="`prompts.${type}.serving.header`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="state.servingImageConfirmed">
              <quantity-badge
                v-if="prompt.badges"
                :amount="state.portionSize.serving?.weight"
                :valid="state.servingImageConfirmed"
              />
            </expansion-panel-actions>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <as-served-selector
            v-model="state.portionSize.serving"
            v-bind="{
              food,
              prompt,
              asServedSetId: parameters.servingImageSet,
            }"
            @confirm="confirmServing"
            @update:model-value="updateServing"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="leftoversEnabled && parameters.leftoversImageSet"
        :disabled="!state.servingImageConfirmed"
      >
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.${type}.leftovers.header`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="state.leftoversPrompt === false || state.leftoversImageConfirmed">
              <quantity-badge
                v-if="prompt.badges"
                :amount="state.portionSize.leftovers?.weight"
                :valid="state.leftoversImageConfirmed"
              />
            </expansion-panel-actions>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <yes-no-toggle v-model="state.leftoversPrompt" class="mb-4" mandatory />
          <template v-if="state.leftoversPrompt">
            <i18n-t class="mb-4" :keypath="`prompts.${type}.leftovers.label`" tag="div">
              <template #food>
                <span class="font-weight-medium">{{ foodName }}</span>
              </template>
            </i18n-t>
            <as-served-selector
              v-model="state.portionSize.leftovers"
              v-bind="{
                food,
                prompt,
                asServedSetId: parameters.leftoversImageSet,
                maxWeight: state.portionSize.serving?.weight,
                type: 'leftovers',
              }"
              @confirm="confirmLeftovers"
              @update:model-value="updateLeftovers"
            />
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="multipleEnabled" :disabled="!servingValid">
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
                unit=""
                :valid="quantityValid"
              />
            </expansion-panel-actions>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <component
            :is="prompt.multiple.type"
            v-if="prompt.multiple"
            v-model="state.portionSize.quantity"
            v-model:confirmed="state.quantityConfirmed"
            v-bind="multipleProps"
            @update:confirmed="confirmQuantity"
            @update:model-value="updateQuantity"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <linked-quantity
        v-if="linkedParent && !linkedParent.auto"
        v-bind="{
          disabled: leftoversEnabled ? !leftoversValid : !servingValid,
          food,
          linkedParent,
          prompt,
        }"
        v-model="state.portionSize.linkedQuantity"
        v-model:confirmed="state.linkedQuantityConfirmed"
        @update:confirmed="confirmLinkedQuantity"
        @update:model-value="selectLinkedQuantity"
      />
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { LinkedParent } from '../../handlers/composables';
import { computed, ref, watch } from 'vue';
import { copy } from '@intake24/common/util';
import { ExpansionPanelActions, YesNoToggle } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';
import { BaseLayout } from '../layouts';
import {
  AsServedSelector,
  LinkedQuantity,
  Next,
  QuantityBadge,
  QuantityCard,
  QuantitySlider,
  useMultiple,
  usePanel,
  usePortionSizeMethod,
} from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

defineOptions({
  components: {
    Slider: QuantitySlider,
    Counter: QuantityCard,
  },
});

const props = defineProps({
  ...createPortionPromptProps<'as-served-prompt'>(),
  linkedParent: {
    type: Object as PropType<LinkedParent>,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action, type } = usePromptUtils(props, { emit });
const { parameters, psmValid } = usePortionSizeMethod<'as-served'>(props);
const { multipleProps, multipleEnabled } = useMultiple(props);
const { foodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));

const leftoversEnabled = computed(() => props.prompt.leftovers && !!parameters.value.leftoversImageSet);
const servingValid = computed(() => !!(state.value.portionSize.serving && state.value.servingImageConfirmed));
const leftoversValid = computed(() => !!(state.value.portionSize.leftovers && state.value.leftoversImageConfirmed));
const quantityValid = computed(() => {
  if (!props.prompt.multiple)
    return true;

  return !props.prompt.multiple.confirm || state.value.quantityConfirmed;
});
const nextStepConditions = computed(() => {
  const conditions = [psmValid.value, servingValid.value];

  if (leftoversEnabled.value)
    conditions.push(state.value.leftoversPrompt === false || leftoversValid.value);

  if (multipleEnabled.value)
    conditions.push(state.value.quantityConfirmed);

  if (props.linkedParent && !props.linkedParent.auto && props.linkedParent.categories.length)
    conditions.push(state.value.linkedQuantityConfirmed);

  return conditions;
});
const validConditions = computed(() => {
  const conditions = [psmValid.value, servingValid.value];

  if (leftoversEnabled.value)
    conditions.push(state.value.leftoversPrompt === false || leftoversValid.value);

  if (multipleEnabled.value)
    conditions.push(quantityValid.value);

  if (props.linkedParent && !props.linkedParent.auto && props.linkedParent.categories.length)
    conditions.push(state.value.linkedQuantityConfirmed);

  return conditions;
});
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, nextStepConditions);

function updateServing() {
  state.value.servingImageConfirmed = false;
  clearLeftovers();
  update();
};

function confirmServing() {
  state.value.servingImageConfirmed = true;
  updatePanel();
  update();
};

function clearLeftovers() {
  state.value.portionSize.leftovers = null;
  state.value.leftoversImageConfirmed = false;
  state.value.leftoversPrompt = undefined;
};

function updateLeftovers() {
  state.value.leftoversImageConfirmed = false;
  update();
};

function confirmLeftovers() {
  state.value.leftoversImageConfirmed = true;
  updatePanel();
  update();
};

function updateQuantity() {
  state.value.quantityConfirmed = false;
  update();
};

function confirmQuantity() {
  state.value.quantityConfirmed = true;
  updatePanel();
  update();
};

function selectLinkedQuantity() {
  update();
};

function confirmLinkedQuantity() {
  updatePanel();
  update();
};

function update() {
  state.value.portionSize.servingWeight
    = (state.value.portionSize.serving?.weight ?? 0) * state.value.portionSize.quantity * state.value.portionSize.linkedQuantity;
  state.value.portionSize.leftoversWeight
    = (state.value.portionSize.leftovers?.weight ?? 0) * state.value.portionSize.quantity * state.value.portionSize.linkedQuantity;

  emit('update:modelValue', state.value);
};

watch(() => state.value.leftoversPrompt, () => {
  state.value.portionSize.leftovers = null;

  updatePanel();
  update();
});
</script>

<style lang="scss" scoped></style>
