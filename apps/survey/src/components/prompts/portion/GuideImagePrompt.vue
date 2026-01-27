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
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="objectValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <image-map-selector
            v-if="imageData"
            v-bind="{
              config: prompt.imageMap,
              imageMapData: imageData.imageMap,
              id: state.portionSize.objectId,
              index: state.portionSize.objectIndex,
              labels,
            }"
            @confirm="confirmObject"
            @select="selectObject"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!objectValid">
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.${type}.quantity`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ selectedFoodLabel }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="quantityValid">
              <quantity-badge
                v-if="prompt.badges"
                :amount="state.portionSize.quantity"
                unit=""
                :valid="state.quantityConfirmed"
              />
            </expansion-panel-actions>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <quantity-card
            v-model="state.portionSize.quantity"
            v-model:confirmed="state.quantityConfirmed"
            @update:confirmed="confirmQuantity"
            @update:model-value="selectQuantity"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <linked-quantity
        v-if="linkedParent && !linkedParent.auto"
        v-bind="{ disabled: !quantityValid, food, linkedParent, prompt }"
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
import type { GuideImageResponse } from '@intake24/common/types/http/foods';

import { computed, ref } from 'vue';

import { copy } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';

import { BaseLayout } from '../layouts';
import {
  ImageMapSelector,
  LinkedQuantity,
  Next,
  QuantityBadge,
  QuantityCard,
  useFetchImageData,
  useLabels,
  usePanel,
  usePortionSizeMethod,
} from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps({
  ...createPortionPromptProps<'guide-image-prompt'>(),
  linkedParent: {
    type: Object as PropType<LinkedParent>,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action, type } = usePromptUtils(props, { emit });
const { conversionFactor, parameters, psmValid } = usePortionSizeMethod<'guide-image'>(props);
const { foodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));
state.value.portionSize.guideImageId = parameters.value.guideImageId;

const { imageData } = useFetchImageData<GuideImageResponse>({
  url: `portion-sizes/guide-images/${parameters.value.guideImageId}`,
  onFetch: (data) => {
    state.value.portionSize.imageUrl = data.imageMap.baseImageUrl;
  },
});

const { labels } = useLabels(props, { type: 'guideImage', data: imageData });

const selectedFoodLabel = computed(() => {
  if (!labels.value.objects.length || state.value.portionSize.objectIndex === undefined)
    return foodName.value;

  return labels.value.objects[state.value.portionSize.objectIndex] || foodName.value;
});

const objectValid = computed(() => (
  state.value.portionSize.objectId !== undefined
  && state.value.portionSize.objectIndex !== undefined
  && state.value.objectConfirmed
));
const quantityValid = computed(() => state.value.quantityConfirmed);
const validConditions = computed(() => {
  const conditions = [psmValid.value, objectValid.value, quantityValid.value];

  if (props.linkedParent && !props.linkedParent.auto && props.linkedParent.categories.length)
    conditions.push(state.value.linkedQuantityConfirmed);

  return conditions;
});
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, validConditions);

function selectObject(idx: number, id: string) {
  state.value.portionSize.objectIndex = idx;
  state.value.portionSize.objectId = id;
  state.value.objectConfirmed = false;
  update();
};

function confirmObject() {
  state.value.objectConfirmed = true;
  updatePanel();
  update();
};

function selectQuantity() {
  update();
};

function confirmQuantity() {
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
  if (imageData.value && state.value.portionSize.objectId !== undefined) {
    const id = state.value.portionSize.objectId;

    state.value.portionSize.objectWeight = imageData.value.objects[id].weight ?? 0;
    state.value.portionSize.servingWeight
      = imageData.value.objects[id].weight
        * state.value.portionSize.quantity
        * conversionFactor.value
        * state.value.portionSize.linkedQuantity;
  }

  emit('update:modelValue', state.value);
};
</script>

<style lang="scss" scoped></style>
