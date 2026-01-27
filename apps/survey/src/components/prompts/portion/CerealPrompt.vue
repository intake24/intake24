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
            v-if="imageData"
            v-bind="{
              config: prompt.imageMap,
              imageMapData: imageData,
              id: state.portionSize.bowlId,
              index: state.portionSize.bowlIndex,
            }"
            @confirm="confirmBowl"
            @select="selectBowl"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!bowlValid">
        <v-expansion-panel-title>
          <i18n-t keypath="prompts.asServed.serving.header" tag="span">
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
            v-if="servingImageSet"
            v-model="state.portionSize.serving"
            v-bind="{
              food,
              prompt,
              asServedSetId: servingImageSet,
            }"
            @confirm="confirmServing"
            @update:model-value="updateServing"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="leftoversEnabled" :disabled="!state.servingImageConfirmed">
        <v-expansion-panel-title>
          <i18n-t keypath="prompts.asServed.leftovers.header" tag="span">
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
            <i18n-t class="mb-4" keypath="prompts.asServed.leftovers.label" tag="div">
              <template #food>
                <span class="font-weight-medium">{{ foodName }}</span>
              </template>
            </i18n-t>
            <as-served-selector
              v-if="leftoverImageSet"
              v-bind="{
                food,
                prompt,
                asServedSetId: leftoverImageSet,
                maxWeight: state.portionSize.serving?.weight,
                type: 'leftovers',
              }"
              @confirm="confirmLeftovers"
              @update:model-value="updateLeftovers"
            />
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { ImageMapResponse } from '@intake24/common/types/http';

import { computed, ref, watch } from 'vue';

import { copy } from '@intake24/common/util';
import { ExpansionPanelActions, YesNoToggle } from '@intake24/survey/components/elements';
import { useFoodUtils, usePromptUtils } from '@intake24/survey/composables';

import { BaseLayout } from '../layouts';
import { AsServedSelector, ImageMapSelector, Next, QuantityBadge, useFetchImageData, usePanel, usePortionSizeMethod } from '../partials';
import { createPortionPromptProps } from '../prompt-props';
import { PortionSizeMethods } from './methods';

const props = defineProps({
  ...createPortionPromptProps<'cereal-prompt'>(),
  bowlImageMapId: {
    type: String,
    default: 'gbowl',
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action, type } = usePromptUtils(props, { emit });
const { parameters, psmValid } = usePortionSizeMethod<'cereal'>(props);
const { foodName } = useFoodUtils(props);

const state = ref(copy(props.modelValue));
state.value.portionSize.type = parameters.value.type;

const bowls = ['A', 'B', 'C', 'D', 'E', 'F'];
const { imageData } = useFetchImageData<ImageMapResponse>({
  url: `portion-sizes/image-maps/${props.bowlImageMapId}`,
  onFetch: (data) => {
    state.value.portionSize.imageUrl = data.baseImageUrl;
  },
});

const servingImageSet = computed(() => {
  const { portionSize: { bowlIndex, method } } = state.value;
  if (bowlIndex === undefined)
    return undefined;

  return `${method}_${parameters.value.type}${bowls[bowlIndex]}`;
});
const leftoverImageSet = computed(() => {
  const { portionSize: { bowlIndex, method } } = state.value;
  if (bowlIndex === undefined)
    return undefined;

  return `${method}_${parameters.value.type}${bowls[bowlIndex]}_leftovers`;
});
const leftoversEnabled = computed(() => props.prompt.leftovers && !!leftoverImageSet.value);

const bowlValid = computed(() => !!(
  state.value.portionSize.bowlId !== undefined
  && state.value.portionSize.bowlIndex !== undefined
  && state.value.portionSize.bowl
  && state.value.bowlConfirmed
));

const servingValid = computed(() => !!(state.value.portionSize.serving && state.value.servingImageConfirmed));
const leftoversValid = computed(() => !!(state.value.portionSize.leftovers && state.value.leftoversImageConfirmed));
const validConditions = computed(() => {
  const conditions = [psmValid.value, bowlValid.value, servingValid.value];

  if (leftoversEnabled.value)
    conditions.push(state.value.leftoversPrompt === false || leftoversValid.value);

  return conditions;
});
const isValid = computed(() => validConditions.value.every(condition => condition));

const { updatePanel } = usePanel(state, validConditions);

watch(() => state.value.leftoversPrompt, () => {
  state.value.portionSize.leftovers = null;

  updatePanel();
  update();
});

function selectBowl(idx: number, id: string) {
  state.value.portionSize.bowlIndex = idx;
  state.value.portionSize.bowlId = id;
  state.value.portionSize.bowl = bowls[idx];
  state.value.bowlConfirmed = false;
  update();
};

function confirmBowl() {
  state.value.bowlConfirmed = true;
  updatePanel();
  update();
};

function updateServing() {
  state.value.servingImageConfirmed = false;
  update();
};

function confirmServing() {
  state.value.servingImageConfirmed = true;
  updatePanel();
  update();
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

function update() {
  state.value.portionSize.servingWeight = state.value.portionSize.serving?.weight ?? 0;
  state.value.portionSize.leftoversWeight = state.value.portionSize.leftovers?.weight ?? 0;

  emit('update:modelValue', state.value);
};
</script>

<style lang="scss" scoped>
.guides-drawer {
  position: relative;

  svg {
    position: absolute;
    top: 0;
    left: 0;

    .guides-drawer-polygon {
      cursor: pointer;
      fill: transparent;

      &.active,
      &:hover {
        fill: #0d47a1;
        fill-opacity: 0.4;
        stroke-width: 8;
        stroke: #0d47a1;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-opacity: 0.5;
      }
    }
  }
}
</style>
