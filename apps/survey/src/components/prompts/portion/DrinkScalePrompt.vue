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
            <expansion-panel-actions :valid="objectValid" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <image-map-selector
            v-if="imageMapData"
            v-bind="{
              config: prompt.imageMap,
              imageMapData,
              id: state.portionSize.containerId,
              index: state.portionSize.containerIndex,
              labels,
            }"
            @confirm="confirmObject"
            @select="selectObject"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!objectValid">
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.${type}.serving.header`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="volumeValid">
              <quantity-badge
                v-if="prompt.badges"
                :amount="
                  state.portionSize.servingWeight
                    ? state.portionSize.servingWeight / state.portionSize.quantity
                    : undefined
                "
                unit="ml"
                :valid="volumeValid"
              />
            </expansion-panel-actions>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <component
            :is="scale.version === 1 ? 'drink-scale-panel' : 'drink-scale-v2-panel'"
            v-if="scale"
            v-model="state.portionSize.fillLevel"
            :open="state.panel === 2"
            :scale="scale"
            @confirm="confirmVolume"
            @update:model-value="updateVolume"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="leftoversEnabled" :disabled="!volumeValid">
        <v-expansion-panel-title>
          <i18n-t :keypath="`prompts.${type}.leftovers.header`" tag="span">
            <template #food>
              <span class="font-weight-medium">{{ foodName }}</span>
            </template>
          </i18n-t>
          <template #actions>
            <expansion-panel-actions :valid="state.leftoversPrompt === false || state.leftoversConfirmed">
              <quantity-badge
                v-if="prompt.badges"
                :amount="
                  state.portionSize.leftoversWeight
                    ? state.portionSize.leftoversWeight / state.portionSize.quantity
                    : undefined
                "
                unit="ml"
                :valid="state.leftoversConfirmed"
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
            <component
              :is="scale.version === 1 ? 'drink-scale-panel' : 'drink-scale-v2-panel'"
              v-if="scale"
              v-model="state.portionSize.leftoversLevel"
              :max-fill-level="state.portionSize.fillLevel"
              :open="state.panel === 3"
              :scale="scale"
              type="leftovers"
              @confirm="confirmLeftovers"
              @update:model-value="updateLeftovers"
            />
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="multipleEnabled" :disabled="!volumeValid">
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
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { DrinkwareScaleEntry } from '@intake24/common/types/http/admin';
import type { DrinkwareScaleV2Response, DrinkwareSetResponse, ImageMapResponse } from '@intake24/common/types/http/foods';
import { copy } from '@intake24/common/util';
import { ExpansionPanelActions, YesNoToggle } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';
import { BaseLayout } from '../layouts';
import {
  calculateVolume as calculateVolumeLUT,
  DrinkScalePanel,
  DrinkScaleV2Panel,
  getScaleBounds,
  ImageMapSelector,
  Next,
  QuantityBadge,
  QuantityCard,
  QuantitySlider,
  useFetchImageData,
  useLabels,
  useMultiple,
  usePanel,
  usePortionSizeMethod,
} from '../partials';
import { calculateFillVolume, getSymmetryShape } from '../partials/drink-scale-cylindrical';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

defineOptions({
  components: {
    DrinkScalePanel,
    DrinkScaleV2Panel,
    Slider: QuantitySlider,
    Counter: QuantityCard,
  },
});

const props = defineProps(createPortionPromptProps<'drink-scale-prompt'>());

const emit = defineEmits(['action', 'update:modelValue']);

function calculateVolume(scale: DrinkwareScaleEntry | DrinkwareScaleV2Response, fillLevel: number): number {
  if (scale.version === 1)
    return calculateVolumeLUT(scale.volumeSamples, fillLevel);

  if (scale.volumeMethod === 'lookUpTable')
    return calculateVolumeLUT(scale.volumeSamplesNormalised, fillLevel);

  // This is redundant, but the state handling code in this prompt is quite complicated
  // so it's easier to just do it again here instead of refactoring the data flow :(

  const symmetryShape = getSymmetryShape(scale.outlineCoordinates);
  const scaleBounds = getScaleBounds(scale.outlineCoordinates);
  const { minY, maxY } = scaleBounds;
  const scaleHeight = maxY - minY;
  const fillLineY = maxY - scaleHeight * fillLevel;
  const fullVolume = calculateFillVolume(symmetryShape, minY, 0.05);
  const filledVolume = calculateFillVolume(symmetryShape, fillLineY, 0.05);
  return (filledVolume * scale.volumeSamplesNormalised[scale.volumeSamplesNormalised.length - 1]) / fullVolume;
}

const { action, type } = usePromptUtils(props, { emit });
const { parameters, psmValid } = usePortionSizeMethod<'drink-scale'>(props);
const { multipleProps, multipleEnabled } = useMultiple(props);
const { foodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));
state.value.portionSize.drinkwareId = parameters.value.drinkwareId;
state.value.portionSize.initialFillLevel = parameters.value.initialFillLevel;
state.value.portionSize.skipFillLevel = parameters.value.skipFillLevel;

if (!state.value.portionSize.fillLevel)
  state.value.portionSize.fillLevel = state.value.portionSize.initialFillLevel;

const drinkwareSetUrl = computed(() => `portion-sizes/drinkware-sets/${parameters.value.drinkwareId}`);
const { imageData: drinkwareSetData } = useFetchImageData<DrinkwareSetResponse>({ url: drinkwareSetUrl });
const imageMapUrl = computed(() => drinkwareSetData.value ? `portion-sizes/image-maps/${drinkwareSetData.value.imageMapId}` : undefined);
const { imageData: imageMapData } = useFetchImageData<ImageMapResponse>({ url: imageMapUrl });

const labelData = computed(() => ({ drinkwareSet: drinkwareSetData.value, imageMap: imageMapData.value }));
const { labels } = useLabels(props, { type: 'drinkScale', data: labelData });

const leftoversEnabled = computed(() => props.prompt.leftovers);

const scale = computed(() => {
  const { containerId } = state.value.portionSize;
  if (containerId === undefined)
    return undefined;

  return drinkwareSetData.value?.scales.find(
    scale => scale.choiceId.toString() === containerId,
  );
});

const skipFillLevel = computed(() => parameters.value.skipFillLevel);
const objectValid = computed(() => (
  state.value.portionSize.containerId !== undefined
  && state.value.portionSize.containerIndex !== undefined
  && state.value.objectConfirmed
));
const volumeValid = computed(() => state.value.volumeConfirmed);
const leftoversValid = computed(() => state.value.leftoversConfirmed);
const quantityValid = computed(() => {
  if (!props.prompt.multiple)
    return true;

  return !props.prompt.multiple.confirm || state.value.quantityConfirmed;
});
const validConditions = computed(() => {
  const conditions = [psmValid.value, objectValid.value, volumeValid.value];

  if (leftoversEnabled.value)
    conditions.push(state.value.leftoversPrompt === false || leftoversValid.value);

  if (multipleEnabled.value)
    conditions.push(quantityValid.value);

  return conditions;
});
const isValid = computed(() => validConditions.value.every(condition => condition));

const nextStepConditions = computed(() => {
  const conditions = [psmValid.value, objectValid.value, volumeValid.value];

  if (leftoversEnabled.value)
    conditions.push(state.value.leftoversPrompt === false || leftoversValid.value);

  if (multipleEnabled.value)
    conditions.push(state.value.quantityConfirmed);

  return conditions;
});

const { updatePanel } = usePanel(state, nextStepConditions);

function selectObject(idx: number, id: string) {
  if (!drinkwareSetData.value)
    return;

  state.value.objectConfirmed = false;

  state.value.portionSize.containerIndex = idx;
  state.value.portionSize.containerId = id;
  state.value.portionSize.imageUrl = drinkwareSetData.value.scales[idx].baseImageUrl;

  clearVolume();
  clearLeftovers();

  state.value.portionSize.servingWeight = calculateVolume(drinkwareSetData.value.scales[idx], state.value.portionSize.fillLevel);

  update();
};

function confirmObject() {
  state.value.objectConfirmed = true;

  if (skipFillLevel.value)
    state.value.volumeConfirmed = true;

  updatePanel();
  update();
};

function clearVolume() {
  state.value.portionSize.fillLevel = state.value.portionSize.initialFillLevel;
  state.value.volumeConfirmed = false;
};

function updateVolume() {
  state.value.volumeConfirmed = false;
  clearLeftovers();
  update();
};

function confirmVolume() {
  state.value.volumeConfirmed = true;
  updatePanel();
  update();
};

function clearLeftovers() {
  state.value.portionSize.leftovers = false;
  state.value.leftoversConfirmed = false;
  state.value.leftoversPrompt = undefined;
};

function updateLeftovers() {
  state.value.leftoversConfirmed = false;
  update();
};

function confirmLeftovers() {
  state.value.leftoversConfirmed = true;
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

function update() {
  if (scale.value) {
    state.value.portionSize.servingWeight
      = calculateVolume(scale.value, state.value.portionSize.fillLevel) * state.value.portionSize.quantity;
    state.value.portionSize.leftoversWeight
      = calculateVolume(scale.value, state.value.portionSize.leftoversLevel) * state.value.portionSize.quantity;
  }

  emit('update:modelValue', state.value);
};

watch(() => state.value.leftoversPrompt, (val) => {
  state.value.portionSize.leftovers = !!val;
  state.value.portionSize.leftoversLevel = 0;

  updatePanel();
  update();
});
</script>

<style lang="scss" scoped></style>
