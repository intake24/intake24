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
          <i18n-t :keypath="`prompts.${type}.container`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="bowlValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <image-map-selector
            v-if="bowlImageMap"
            v-bind="{
              config: prompt.imageMap,
              imageMapData: bowlImageMap,
              id: state.portionSize.bowlId,
              index: state.portionSize.bowlIndex,
              labels: bowlLabels,
            }"
            @confirm="confirmBowl"
            @select="selectBowl"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!bowlValid">
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.${type}.milk`" />
          <template #actions>
            <expansion-panel-actions :valid="milkLevelValid">
              <quantity-badge
                v-if="prompt.badges"
                :amount="milkLevelWeight"
                :valid="milkLevelValid"
              />
            </expansion-panel-actions>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <image-map-selector
            v-if="milkLevelImageMap"
            v-bind="{
              config: prompt.imageMap,
              imageMapData: milkLevelImageMap,
              id: state.portionSize.milkLevelId,
              index: state.portionSize.milkLevelIndex,
              labels: milkLevelLabels,
            }"
            @confirm="confirmMilk"
            @select="selectMilk"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { ImageMapResponse } from '@intake24/common/types/http/foods';

import { computed, ref } from 'vue';

import { copy } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';

import { BaseLayout } from '../layouts';
import {
  ImageMapSelector,
  Next,
  QuantityBadge,
  useFetchImageData,
  useLabels,
  usePanel,
  usePortionSizeMethod,
} from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps({
  ...createPortionPromptProps<'milk-on-cereal-prompt'>(),
  bowlImageMapId: {
    type: String,
    default: 'gbowl',
  },
});
const emit = defineEmits(['action', 'update:modelValue']);

const bowls = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
type Bowl = (typeof bowls)[number];
const milkDensity = 1.032;
const volumeDefs: Record<Bowl, number[]> = {
  A: [52.3, 100.0, 172.0, 267.7, 389.3, 522.3],
  B: [62.7, 138.0, 249.0, 385.7],
  C: [49.0, 121.3, 233.3, 358.7, 481.0, 622.3],
  D: [18.3, 36.0, 70.3, 126.7, 195.3, 287.3],
  E: [38.0, 103.7, 197.0, 305.7, 428.0, 559.3],
  F: [49.3, 104.7, 187.7, 295.3, 420.0, 570.3],
};
const milkLevelImageMapPrefix = 'milkbowl';

const { action, type } = usePromptUtils(props, { emit });
const { psmValid } = usePortionSizeMethod<'milk-on-cereal'>(props);
const { foodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));

const bowlImageMapUrl = computed(() => `portion-sizes/image-maps/${props.bowlImageMapId}`);
const { imageData: bowlImageMap } = useFetchImageData<ImageMapResponse>({
  url: bowlImageMapUrl,
  onFetch: (data) => {
    state.value.portionSize.imageUrl = data.baseImageUrl;

    if (props.parentFood?.type !== 'encoded-food' || props.parentFood?.portionSize?.method !== 'cereal')
      return;

    const { bowlIndex, bowlId } = props.parentFood.portionSize;

    if (bowlIndex !== undefined && bowlId !== undefined) {
      selectBowl(bowlIndex, bowlId);
      confirmBowl();
    }
  },
});
const { labels: bowlLabels } = useLabels(props, { type: 'imageMap', data: bowlImageMap });

const bowl = computed(() => state.value.portionSize.bowl ?? undefined);
const milkLevelImageMapId = computed(() => {
  if (bowl.value === undefined)
    return undefined;

  return `${milkLevelImageMapPrefix}${bowl.value}`;
});
const imageMapUrl = computed(() => milkLevelImageMapId.value ? `portion-sizes/image-maps/${milkLevelImageMapId.value}` : undefined);
const { imageData: milkLevelImageMap } = useFetchImageData<ImageMapResponse>({
  url: imageMapUrl,
  onFetch: (data) => {
    state.value.portionSize.milkLevelImage = data.baseImageUrl;
  },
});
const { labels: milkLevelLabels } = useLabels(props, { type: 'imageMap', data: milkLevelImageMap });

const bowlValid = computed(() => !!(
  state.value.portionSize.bowlId !== undefined
  && state.value.portionSize.bowlIndex !== undefined
  && state.value.portionSize.bowl
  && state.value.bowlConfirmed
));

const milkLevelWeight = computed(() => {
  if (!state.value.portionSize.bowl || state.value.portionSize.milkLevelIndex === undefined)
    return undefined;

  return (volumeDefs[state.value.portionSize.bowl as Bowl][state.value.portionSize.milkLevelIndex] * milkDensity);
});

const milkLevelValid = computed(() => (
  state.value.portionSize.milkLevelId !== undefined
  && state.value.portionSize.milkLevelIndex !== undefined
  && state.value.milkLevelConfirmed
));

const validConditions = computed(() => [psmValid.value, bowlValid.value, milkLevelValid.value]);
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, validConditions);

function selectBowl(idx: number, id: string) {
  state.value.portionSize.bowlIndex = idx;
  state.value.portionSize.bowlId = id;
  state.value.portionSize.bowl = bowls[idx];
  state.value.bowlConfirmed = false;
  clearMilk();
  update();
};

function confirmBowl() {
  state.value.bowlConfirmed = true;
  updatePanel();
  update();
};

function clearMilk() {
  state.value.portionSize.milkLevelId = undefined;
  state.value.portionSize.milkLevelIndex = undefined;
  state.value.milkLevelConfirmed = false;
};

function selectMilk(idx: number, id: string) {
  state.value.portionSize.milkLevelIndex = idx;
  state.value.portionSize.milkLevelId = id;
  state.value.milkLevelConfirmed = false;
  update();
};

function confirmMilk() {
  state.value.milkLevelConfirmed = true;
  updatePanel();
  update();
};

function update() {
  if (milkLevelWeight.value !== undefined)
    state.value.portionSize.servingWeight = milkLevelWeight.value;

  emit('update:modelValue', state.value);
};
</script>

<style lang="scss" scoped></style>
