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
          {{ $t(`prompts.${type}.typeLabel`) }}
          <template #actions>
            <expansion-panel-actions :valid="state.confirmed.type" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <image-map-selector
            v-if="imageMaps.type"
            v-bind="{
              config: prompt.imageMap,
              imageMapData: imageMaps.type,
              id: state.portionSize.type.id,
              index: state.portionSize.type.index,
              labels: imageMapLabels.type,
            }"
            @confirm="confirmType('type')"
            @select="(idx, id) => selectType('type', idx, id)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t(`prompts.${type}.thicknessLabel`) }}
          <template #actions>
            <expansion-panel-actions :valid="state.confirmed.thickness" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <image-map-selector
            v-if="imageMaps.thickness"
            v-bind="{
              config: prompt.imageMap,
              imageMapData: imageMaps.thickness,
              id: state.portionSize.thickness.id,
              index: state.portionSize.thickness.index,
              labels: imageMapLabels.thickness,
            }"
            @confirm="confirmType('thickness')"
            @select="(idx, id) => selectType('thickness', idx, id)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!state.confirmed.type">
        <v-expansion-panel-title>
          {{ $t(`prompts.${type}.sizeLabel`) }}
          <template #actions>
            <expansion-panel-actions :valid="state.confirmed.slice" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <image-map-selector
            v-if="imageMaps.slice"
            v-bind="{
              config: prompt.imageMap,
              disabled: state.portionSize.slice.index === undefined,
              imageMapData: imageMaps.slice,
              id: state.portionSize.slice.id,
              index: state.portionSize.slice.index ? state.portionSize.slice.index - 1 : undefined,
              labels: imageMapLabels.slice,
            }"
            @confirm="confirmType('slice')"
            @select="(idx, id) => selectType('slice', idx + 1, id)"
          >
            <template #label>
              <v-btn
                class="ma-2 font-weight-medium"
                :color="isWholeSelected ? 'info' : ''"
                rounded
                :title="$t(`prompts.${type}.whole.confirm`)"
                @click="selectType('slice', 0, '0')"
              >
                {{ $t(`prompts.${type}.whole.confirm`) }}
              </v-btn>
            </template>
          </image-map-selector>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!state.confirmed.slice">
        <v-expansion-panel-title>
          {{ $t(`prompts.${type}.${isWholeSelected ? 'whole' : 'slices'}.label`) }}
          <template #actions>
            <expansion-panel-actions :valid="state.confirmed.quantity" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <quantity-card
            v-model="state.portionSize.slice.quantity"
            v-model:confirmed="state.confirmed.quantity"
            @update:confirmed="confirmType('quantity', $event)"
            @update:model-value="selectQuantity"
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

import { computed, onMounted, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { copy } from '@intake24/common/util';
import { ExpansionPanelActions } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';
import { useHttp, useI18n } from '@intake24/ui';

import { BaseLayout } from '../layouts';
import { ImageMapSelector, Next, QuantityCard, usePanel, usePortionSizeMethod } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps(createPortionPromptProps<'pizza-prompt'>());

const emit = defineEmits(['action', 'update:modelValue']);

const http = useHttp();
const { mobile } = useDisplay();
const { translate } = useI18n();
const { action, type } = usePromptUtils(props, { emit });
const { parameters, psmValid } = usePortionSizeMethod<'pizza'>(props);
const { foodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));

type PizzaImageMap = 'type' | 'thickness' | 'slice';

const thicknessFactors = [
  [0.9, 1.0, 1.1, 1.4, 1.6],
  [1.0, 1.2, 1.3, 1.7, 1.8],
  [0.7, 0.8, 0.8, 1.1, 1.2],
  [0.6, 0.7, 0.8, 1.0, 1.1],
  [1.2, 1.4, 1.5, 2.0, 2.2],
  [0.5, 0.6, 0.7, 0.9, 1.0],
  [0.9, 1.1, 1.2, 1.5, 1.7],
  [0.8, 0.9, 1.0, 1.3, 1.5],
  [1.0, 1.2, 1.3, 1.7, 1.8],
];

const sliceWeights = [
  [335, 167.5, 83.8, 41.9],
  [379, 189.5, 94.8, 47.4],
  [390, 195.0, 97.5, 48.8],
  [162, 81.0, 40.5, 20.3],
  [68, 34.0, 17.0, 8.5],
  [135, 67.5, 33.8],
  [562, 281.0, 140.5, 70.3],
  [288, 144.0, 72.0, 36.0],
  [131, 65.5, 32.8, 16.4],
];

const typeImageMapId = 'gpizza';
const thicknessImageMapId = 'gpthick';
const sliceImageMapPrefix = 'gpiz';

const imageMaps = ref<Record<PizzaImageMap, ImageMapResponse | null>>({
  type: null,
  thickness: null,
  slice: null,
});

const sliceImageMapId = computed(() => {
  const { id } = state.value.portionSize.type;

  if (id === undefined)
    return '';

  return `${sliceImageMapPrefix}${id}`;
});
const imageMapIds = computed(() => ({
  type: typeImageMapId,
  thickness: thicknessImageMapId,
  slice: sliceImageMapId.value,
}));

const labelsEnabled = computed(() => props.prompt.imageMap.labels && !!parameters.value.labels);
const imageMapLabels = computed(() => {
  if (!labelsEnabled.value) {
    return {
      type: { image: '', objects: [] },
      thickness: { image: '', objects: [] },
      slice: { image: '', objects: [] },
    };
  }

  return Object.keys(imageMapIds.value).reduce<Record<PizzaImageMap, { image: string; objects: string[] }>>(
    (acc, key) => {
      const pizzaType = key as PizzaImageMap;

      acc[pizzaType] = {
        image: translate(imageMaps.value[pizzaType]?.label) ?? '',
        objects: imageMaps.value[pizzaType]?.objects.map(({ label }) => translate(label)) ?? [],
      };
      return acc;
    },
    {} as Record<PizzaImageMap, { image: string; objects: string[] }>,
  );
});

const isWholeSelected = computed(() => state.value.portionSize.slice.index === 0);

const typeValid = computed(() => (
  state.value.portionSize.type.id !== undefined
  && state.value.portionSize.type.index !== undefined
  && state.value.confirmed.type
));
const thicknessValid = computed(() => (
  state.value.portionSize.thickness.id !== undefined
  && state.value.portionSize.thickness.index !== undefined
  && state.value.confirmed.thickness
));
const sliceValid = computed(() => (
  state.value.portionSize.slice.id !== undefined
  && state.value.portionSize.slice.index !== undefined
  && state.value.confirmed.slice
));
const quantityValid = computed(() => state.value.confirmed.quantity);
const validConditions = computed(() => [psmValid.value, typeValid.value, thicknessValid.value, sliceValid.value, quantityValid.value]);
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, validConditions);

async function fetchPizzaImageMap(type: PizzaImageMap) {
  const imageMapId = imageMapIds.value[type];
  if (!imageMapId)
    return;

  const { data } = await http.get<ImageMapResponse>(`portion-sizes/image-maps/${imageMapId}`);

  imageMaps.value[type] = { ...data };
  state.value.portionSize[type].image = data.baseImageUrl;
};

function clearType(type: PizzaImageMap) {
  state.value.portionSize[type].id = undefined;
  state.value.portionSize[type].index = undefined;
  state.value.confirmed[type] = false;
  updatePanel();
  update();
};

function selectType(type: PizzaImageMap, idx: number, id: string) {
  state.value.portionSize[type].index = idx;
  state.value.portionSize[type].id = id;
  state.value.confirmed[type] = false;
  update();

  if (type === 'type') {
    clearType('slice');
    confirmType('quantity', false);
  }

  if (type === 'slice') {
    confirmType('quantity', false);

    if (!mobile.value)
      confirmType(type);
  }
};

function selectQuantity() {
  update();
};

function confirmType(type: PizzaImageMap | 'quantity', value = true) {
  state.value.confirmed[type] = value;
  updatePanel();
  update();
};

function sliceWeight(type?: number, slice?: number, thickness?: number) {
  if (type === undefined || slice === undefined || thickness === undefined)
    return 0;

  return sliceWeights[type][slice] * thicknessFactors[type][thickness];
};

function update() {
  const { portionSize } = state.value;

  state.value.portionSize.servingWeight
    = sliceWeight(
      Number(portionSize.type.id) - 1,
      Number(portionSize.slice.id),
      Number(portionSize.thickness.id) - 1,
    ) * portionSize.slice.quantity;

  emit('update:modelValue', state.value);
};

onMounted(async () => {
  await Promise.all(
    Object.keys(imageMapIds.value).map(key => fetchPizzaImageMap(key as PizzaImageMap)),
  );
});

watch(sliceImageMapId, async (val) => {
  if (!val)
    return;

  await fetchPizzaImageMap('slice');
});
</script>

<style lang="scss" scoped></style>
