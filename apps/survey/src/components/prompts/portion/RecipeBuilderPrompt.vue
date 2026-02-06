<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="state.activeStep" :tile="$vuetify.display.mobile" @update:model-value="updateActiveStep">
      <v-expansion-panel v-for="(step, index) in state.steps" :key="index">
        <v-expansion-panel-title>
          <div>
            <v-avatar class="me-2" color="primary" size="28">
              <span class="text-white font-weight-medium">{{ index + 1 }}</span>
            </v-avatar>
            {{ translate(step.name) }}
          </div>
          <template #actions>
            <expansion-panel-actions :valid="isStepValid(step)" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-sheet class="mb-4">
            {{ translate(step.description) }}
          </v-sheet>
          <v-expand-transition>
            <v-radio-group
              v-if="!step.required"
              v-model="step.confirmed"
              inline
              @update:model-value="onConfirmToggleIngredients(index)"
            >
              <v-radio
                false-icon="fa-regular fa-circle"
                :label="$t('prompts.recipeBuilder.optional.confirm')"
                true-icon="$yes"
                value="yes"
              />
              <v-radio
                false-icon="fa-regular fa-circle"
                :label="$t('prompts.recipeBuilder.optional.reject')"
                true-icon="$no"
                value="no"
              />
            </v-radio-group>
          </v-expand-transition>

          <v-sheet v-if="!step.required && step.confirmed === 'yes'" class="mb-4">
            {{ $t('prompts.recipeBuilder.optional.infoPrompt') }}
          </v-sheet>
          <selected-food-list
            v-bind="{ index, meal, prompt, step }"
            :show="step.foods.length > 0 && step.confirmed !== 'no'"
            @remove="removeFood"
          />
          <v-btn-toggle
            v-if="(step.required || step.confirmed === 'yes') && step.multiple && step.foods.length > 0"
            v-model="step.anotherFoodConfirmed"
            class="bg-grey-lighten-4"
            color="primary"
            divided
            :row="!$vuetify.display.mobile"
            variant="outlined"
            @update:model-value="onToggleStepAddMore(index)"
          >
            <v-btn :value="true">
              {{ $t('prompts.recipeBuilder.addMore') }}
            </v-btn>
            <v-btn :value="false">
              {{ $t('prompts.recipeBuilder.noMore') }}
            </v-btn>
          </v-btn-toggle>

          <food-browser
            v-if="showFoodBrowser(step)"
            v-bind="{
              localeId,
              surveySlug,
              stepName: translate(step.name),
              requiredToFill: step.required,
              rootCategory: step.categoryCode,
              prompt,
              section,
            }"
            @food-missing="(searchTerm) => foodMissing(index, searchTerm)"
            @food-selected="(food) => foodSelected(index, food)"
            @food-skipped="foodSkipped(index)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <missing-all-recipe-ingredients
      v-bind="{
        modelValue: allConfirmed && !atLeastOneFoodSelected,
        message: $t('prompts.recipeBuilder.missingAllIngredients'),
      }"
      :class="{ 'mt-4': $vuetify.display.mobile }"
    />
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type {
  FoodBuilderIngredientStepState,
  MissingFoodRecipeBuilderItemState,
  PromptStates,
  SelectedFoodRecipeBuilderItemState,
} from '@intake24/common/prompts';
import type { RecipeBuilder } from '@intake24/common/surveys';
import type { FoodHeader } from '@intake24/common/types/http';

import { computed, ref } from 'vue';

import { copy } from '@intake24/common/util';
import {
  ExpansionPanelActions,
  FoodBrowser,
  MissingAllRecipeIngredients,
  SelectedFoodList,
} from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';
import { foodsService } from '@intake24/survey/services';
import { getEntityId } from '@intake24/survey/util';
import { useI18n } from '@intake24/ui';

import { BaseLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';
import { getNextStep, isStepValid } from './builder-steps/step';

const props = defineProps({
  ...createBasePromptProps<'recipe-builder-prompt', RecipeBuilder>(),
  localeId: {
    type: String,
    required: true,
  },
  surveySlug: {
    type: String,
  },
  modelValue: {
    type: Object as PropType<PromptStates['recipe-builder-prompt']>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { translate } = useI18n();
const { action } = usePromptUtils(props, { emit });

const state = ref(copy(props.modelValue));

const allConfirmed = computed(() => state.value.steps.every(step => isStepValid(step)));
const atLeastOneFoodSelected = computed(() => state.value.steps.some(step => step.foods.length > 0));
const isValid = computed(() => allConfirmed.value && atLeastOneFoodSelected.value);

function removeFood({ foodIndex, index }: { foodIndex: number; index: number }) {
  const foodToRemove = state.value.steps[index].foods.splice(foodIndex, 1);
  if (!state.value.steps[index].foods.length)
    state.value.steps[index].confirmed = undefined;

  if (foodToRemove === undefined)
    return;
  update();
};

function update() {
  emit('update:modelValue', state.value);
};

function foodSelected(index: number, selectedFood: SelectedFoodRecipeBuilderItemState): void {
  onFoodSelected({ type: 'selected', selectedFood }, index);
};

function foodMissing(index: number, searchTerm?: string | null) {
  onFoodSelected({ type: 'missing', searchTerm }, index);
};

function foodSkipped(index: number): void {
  state.value.activeStep = index + 1;
  state.value.steps[index].confirmed = 'yes';
  state.value.steps[index].anotherFoodConfirmed = undefined;
  update();
};

async function onFoodSelected(
  item:
    | { type: 'selected'; selectedFood: FoodHeader }
    | { type: 'missing'; searchTerm?: string | null },
  idx: number,
): Promise<void> {
  const step = state.value.steps[idx];
  const id = getEntityId();

  let food: MissingFoodRecipeBuilderItemState | SelectedFoodRecipeBuilderItemState;
  if (item.type === 'missing') {
    food = {
      ...item,
      id,
      idx,
      name: `${step.categoryCode}: ${item.searchTerm ? item.searchTerm : step.name.en}`,
    };
  }
  else {
    const { selectedFood, type } = item;
    const ingredient = await foodsService.getData(props.localeId, selectedFood.code);
    food = {
      type,
      ...selectedFood,
      name: ingredient.localName,
      id,
      idx,
      ingredient,
    };
  }

  const foods = step.foods.slice();
  foods.push(food);

  const update: FoodBuilderIngredientStepState = {
    ...step,
    foods,
    anotherFoodConfirmed: undefined,
  };

  state.value.steps.splice(idx, 1, update);

  updateActiveStep(idx);
  goToNextIfCan(idx);
};

function goToNextIfCan(index: number) {
  if (!isStepValid(state.value.steps[index]))
    return;

  state.value.activeStep = getNextStep(state.value.steps);
};

function updateActiveStep(index: number) {
  state.value.activeStep = index;
  update();
};

function onToggleStepAddMore(stepIndex: number) {
  goToNextIfCan(stepIndex);
};

function onConfirmToggleIngredients(index: number) {
  goToNextIfCan(index);
};

function showFoodBrowser(step: FoodBuilderIngredientStepState): boolean {
  if (step.required || step.confirmed === 'yes') {
    // Current step needs at least one food to be selected, and it hasn't
    if (step.foods.length === 0)
      return true;
    else
    // Some foods have already been added, but another food has been confirmed by the user
      return step.anotherFoodConfirmed === true;
  }
  else {
    // Step has not been confirmed or has been rejected (i.e. step.required is false and
    // step.confirmed is either 'no' or undefined)
    return false;
  }
};
</script>

<style lang="scss" scoped></style>
