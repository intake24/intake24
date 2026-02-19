<template>
  <v-sheet class="mb-4">
    {{ translate(step.description) }}
  </v-sheet>
  <v-expand-transition>
    <v-radio-group
      v-if="!step.required"
      v-model="state.confirmed"
      inline
      @update:model-value="goToNext"
    >
      <v-radio
        false-icon="fa-regular fa-circle"
        :label="$t(`prompts.${type}.optional.confirm`)"
        true-icon="$yes"
        value="yes"
      />
      <v-radio
        false-icon="fa-regular fa-circle"
        :label="$t(`prompts.${type}.optional.reject`)"
        true-icon="$no"
        value="no"
      />
    </v-radio-group>
  </v-expand-transition>
  <v-sheet v-if="!step.required && state.confirmed === 'yes'" class="mb-4">
    {{ $t(`prompts.${type}.optional.infoPrompt`) }}
  </v-sheet>
  <selected-food-list
    v-bind="{ prompt, step: state }"
    @remove="removeFood"
  />
  <v-btn-toggle
    v-if="(step.required || state.confirmed === 'yes') && step.multiple && state.foods.length > 0"
    v-model="state.anotherFoodConfirmed"
    class="bg-grey-lighten-4"
    color="primary"
    divided
    :row="!$vuetify.display.mobile"
    variant="outlined"
    @update:model-value="goToNext"
  >
    <v-btn :value="true">
      {{ $t(`prompts.${type}.addMore`) }}
    </v-btn>
    <v-btn :value="false">
      {{ $t(`prompts.${type}.noMore`) }}
    </v-btn>
  </v-btn-toggle>
  <food-browser
    v-if="showFoodBrowser"
    v-bind="{
      localeId,
      surveySlug,
      stepName: translate(step.name),
      requiredToFill: step.required,
      rootCategory: step.categoryCode,
      prompt,
      section,
    }"
    @food-missing="foodMissing"
    @food-selected="foodSelected"
    @food-skipped="foodSkipped"
  />
</template>

<script lang="ts" setup>
import type { MissingFoodRecipeBuilderItemState, SelectedFoodRecipeBuilderItemState } from '@intake24/common/prompts';
import type { FoodHeader } from '@intake24/common/types/http';

import { useVModel } from '@vueuse/core';
import { computed } from 'vue';

import { FoodBrowser, SelectedFoodList } from '@intake24/survey/components/elements';
import { foodsService } from '@intake24/survey/services';
import { promptType, useI18n } from '@intake24/ui';

import { createStepProps } from './use-step';

defineOptions({ inheritAttrs: false });
const props = defineProps(createStepProps<'ingredient'>());
const emit = defineEmits(['update:modelValue', 'goToNext']);

const state = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

const { translate } = useI18n();

const type = computed(() => promptType(props.prompt.component));

function foodSelected(selectedFood: SelectedFoodRecipeBuilderItemState): void {
  onFoodSelected({ type: 'selected', selectedFood });
  goToNext();
};

function foodMissing(searchTerm?: string | null) {
  onFoodSelected({ type: 'missing', searchTerm });
  goToNext();
};

function foodSkipped() {
  state.value.confirmed = 'no';
  state.value.anotherFoodConfirmed = undefined;
  goToNext();
};

async function onFoodSelected(item: { type: 'selected'; selectedFood: FoodHeader } | { type: 'missing'; searchTerm?: string | null },
) {
  let food: MissingFoodRecipeBuilderItemState | SelectedFoodRecipeBuilderItemState;
  if (item.type === 'missing') {
    food = {
      ...item,
      name: `${props.step.categoryCode}: ${item.searchTerm ? item.searchTerm : props.step.name.en}`,
    };
  }
  else {
    const { selectedFood, type } = item;
    const ingredient = await foodsService.getData(props.localeId, selectedFood.code);
    food = {
      type,
      ...selectedFood,
      name: ingredient.localName,
      ingredient,
    };
  }

  state.value.foods.push(food);
  state.value.anotherFoodConfirmed = undefined;
};

function removeFood(index: number) {
  state.value.foods.splice(index, 1);

  if (!state.value.foods.length)
    state.value.confirmed = undefined;
};

function goToNext() {
  emit('goToNext');
};

const showFoodBrowser = computed(() => {
  if (props.step.required || state.value.confirmed === 'yes') {
    // Current step needs at least one food to be selected, and it hasn't
    if (state.value.foods.length === 0)
      return true;
    else
    // Some foods have already been added, but another food has been confirmed by the user
      return state.value.anotherFoodConfirmed === true;
  }
  else {
    // Step has not been confirmed or has been rejected (i.e. step.required is false and
    // step.confirmed is either 'no' or undefined)
    return false;
  }
});
</script>

<style lang="scss">
</style>
