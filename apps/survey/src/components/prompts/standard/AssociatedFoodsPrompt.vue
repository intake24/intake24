<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="activePrompt" :tile="$vuetify.display.mobile" @update:model-value="updatePrompts">
      <v-expansion-panel v-for="(promptState, index) in promptStates" :key="index">
        <v-expansion-panel-title>
          {{ translate(prompts[index].promptText) }}
          <template #actions>
            <expansion-panel-actions :valid="isPromptValid(promptState)" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex flex-column ga-6">
            <v-alert
              v-if="availableFoods[index].length && !promptState.mainFoodConfirmed"
              color="primary"
              density="compact"
            >
              <template #prepend>
                <v-icon icon="$info" size="24" />
              </template>
              {{ promptI18n['existingFoods.hint'] }}
            </v-alert>
            <v-radio-group
              v-model="promptState.mainFoodConfirmed"
              :inline="!$vuetify.display.mobile"
              @update:model-value="onConfirmStateChanged(index)"
            >
              <v-radio
                false-icon="fa-regular fa-circle"
                :label="promptI18n.no"
                true-icon="$yes"
                :value="false"
              />
              <v-radio
                false-icon="fa-regular fa-circle"
                :label="promptI18n.yes"
                true-icon="$yes"
                :value="true"
              />
            </v-radio-group>
            <!-- Selected foods list -->
            <v-expand-transition>
              <div
                v-if="promptState.foods.length"
                class="d-flex flex-column gr-3"
              >
                <v-card
                  v-for="(foodItem, foodIndex) in promptState.foods"
                  :key="foodIndex"
                  color="primary"
                  flat
                  variant="tonal"
                >
                  <v-card-text class="d-flex flex-column flex-sm-row justify-space-between align-stretch align-sm-center ga-4 pa-4 py-sm-2 ">
                    <div class="text-h6 text-black opacity-90">
                      <v-icon icon="$food" start />
                      {{ associatedFoodDescription(foodItem) }}
                    </div>
                    <div class="d-flex flex-column ga-1">
                      <v-btn
                        color="primary"
                        rounded="pill"
                        :title="promptI18n['select.different']"
                        variant="flat"
                        @click="replaceFood(index, foodIndex)"
                      >
                        <v-icon icon="$edit" start />
                        {{ promptI18n['select.different'] }}
                      </v-btn>
                      <confirm-dialog
                        v-if="allowMultiple && prompts[index].multiple"
                        :label="promptI18n['select.remove']"
                        @confirm="removeFood(index, foodIndex)"
                      >
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            color="error"
                            rounded="pill"
                            :title="promptI18n['select.remove']"
                            variant="flat"
                          >
                            <v-icon icon="$delete" start />
                            {{ promptI18n['select.remove'] }}
                          </v-btn>
                        </template>
                        <i18n-t keypath="recall.menu.food.deleteConfirm" tag="span">
                          <template #item>
                            <span class="font-weight-medium">
                              {{ associatedFoodDescription(foodItem) }}
                            </span>
                          </template>
                        </i18n-t>
                      </confirm-dialog>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-expand-transition>
            <!-- Additional food confirmation -->
            <v-expand-transition>
              <v-card v-show="showMoreFoodsQuestion(index)" flat>
                <div class="mb-2">
                  {{ promptI18n.moreFoodsQuestion }}
                </div>
                <v-radio-group
                  v-model="promptState.additionalFoodConfirmed"
                  :inline="!$vuetify.display.mobile"
                  @update:model-value="onMultipleFoodConfirm(index)"
                >
                  <v-radio
                    false-icon="fa-regular fa-circle"
                    :label="promptI18n.no"
                    true-icon="$yes"
                    :value="false"
                  />
                  <v-radio
                    false-icon="fa-regular fa-circle"
                    :label="promptI18n.yesAnother"
                    true-icon="$yes"
                    :value="true"
                  />
                </v-radio-group>
              </v-card>
            </v-expand-transition>
            <!-- Existing food option: if there are any foods in the same meal that match
            the associated food criteria, allow to pick one of them -->
            <v-expand-transition>
              <div
                v-if="
                  availableFoods[index].length
                    && ((promptState.mainFoodConfirmed && (!promptState.foods.length || replaceFoodIndex[index] !== undefined)) || promptState.additionalFoodConfirmed)"
                flat
              >
                <div class="mb-2">
                  {{ promptI18n['existingFoods.title'] }}
                </div>
                <v-radio-group
                  v-model="promptState.existing"
                  :inline="!$vuetify.display.mobile"
                >
                  <v-radio
                    class="mr-4"
                    false-icon="far fa-circle"
                    :label="$t('common.action.no')"
                    true-icon="$yes"
                    :value="false"
                  />
                  <v-radio
                    false-icon="far fa-circle"
                    :label="$t('common.action.yes')"
                    true-icon="$yes"
                    :value="true"
                  />
                </v-radio-group>
              </div>
            </v-expand-transition>
            <!-- Database lookup -->
            <v-expand-transition>
              <div v-if="showFoodChooser(index)" flat>
                <div class="mb-2">
                  {{ promptState.existing && availableFoods[index].length ? promptI18n['existingFoods.select'] : promptI18n.databaseLookup }}
                </div>
                <meal-food-chooser
                  v-if="promptState.existing && availableFoods[index].length"
                  :filter="(food) => availableFoods[index].includes(food.id)"
                  :meal
                  @selected="(id) => existingFoodSelected(id, index)"
                />
                <food-browser
                  v-else
                  v-bind="{
                    localeId,
                    surveySlug,
                    prompt,
                    rootCategory: prompts[index].categoryCode,
                    section,
                    includeHidden: true,
                    recipe: true,
                  }"
                  @food-missing="foodMissing(index)"
                  @food-selected="(food) => foodSelected(food, index)"
                />
              </div>
            </v-expand-transition>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </base-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { AssociatedFoodPrompt, AssociatedFoodPromptItem } from '@intake24/common/prompts';
import type { FoodHeader, UserAssociatedFoodPrompt } from '@intake24/common/types/http';

import { computed, ref, watch } from 'vue';

import { getFoodDescription } from '@intake24/common/surveys';
import { copy } from '@intake24/common/util';
import { ExpansionPanelActions, FoodBrowser } from '@intake24/survey/components/elements';
import { MealFoodChooser, useScrollToPanel } from '@intake24/survey/components/prompts/partials';
import { usePromptUtils } from '@intake24/survey/composables';
import { ConfirmDialog, useI18n } from '@intake24/ui';

import { BaseLayout } from '../layouts';
import { Next } from '../partials';
import { createFoodPromptProps } from '../prompt-props';

const props = defineProps({
  ...createFoodPromptProps<'associated-foods-prompt'>(),
  prompts: {
    type: Array as PropType<UserAssociatedFoodPrompt[]>,
    required: true,
  },
  localeId: {
    type: String,
    required: true,
  },
  surveySlug: {
    type: String,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

function isPromptValid(prompt: AssociatedFoodPrompt): boolean {
  return prompt.mainFoodConfirmed === false
    || (prompt.mainFoodConfirmed === true
      && prompt.foods.length > 0
      && prompt.additionalFoodConfirmed === false);
}

function getNextPrompt(prompts: AssociatedFoodPrompt[]) {
  return prompts.findIndex(prompt => !isPromptValid(prompt));
}

const { translate, i18n: { t } } = useI18n();
const { action, translatePrompt, type } = usePromptUtils(props, { emit });

const promptI18n = computed(() =>
  translatePrompt([
    'existingFoods.title',
    'existingFoods.hint',
    'existingFoods.select',
    'yes',
    'yesAnother',
    'no',
    'moreFoodsQuestion',
    'databaseLookup',
    'select.different',
    'select.remove',
  ]),
);

const activePrompt = ref(props.modelValue.activePrompt);
useScrollToPanel(activePrompt);

const promptStates = ref(copy(props.modelValue.promptStates));
const replaceFoodIndex = ref(props.prompts.map(() => undefined as number | undefined));
function allowMultiple(prompt: UserAssociatedFoodPrompt): boolean {
  return props.prompt.multiple && prompt.multiple;
}

const isValid = computed(() => promptStates.value.every(isPromptValid));
const usedExistingFoodIds = computed(() => promptStates.value.flatMap(prompt =>
  prompt.foods
    .filter(food => food.type === 'existing' && food.existingFoodId !== undefined)
    .map(food => food.existingFoodId!),
));

const availableFoods = computed(() => {
  const foodsInThisMeal = props.meal?.foods ?? [];

  return props.prompts.map((prompt) => {
    const availableFoods: string[] = [];

    for (const food of foodsInThisMeal) {
      // Don't link food to itself
      if (food.id === props.food.id)
        continue;

      // Don't allow linking foods that have linked foods of their own
      if (food.linkedFoods.length)
        continue;

      // Don't allow two or more prompts to refer to the same existing food id.
      if (usedExistingFoodIds.value.includes(food.id))
        continue;

      const matchesFood
        = prompt.foodCode !== undefined
          && food.type === 'encoded-food'
          && food.data.code === prompt.foodCode;

      const matchesCategory
        = prompt.categoryCode !== undefined
          && food.type === 'encoded-food'
          && food.data.categories.includes(prompt.categoryCode);

      if (matchesFood || matchesCategory)
        availableFoods.push(food.id);
    }

    return availableFoods;
  });
});

// React to changes to the meal's foods list and filter out references to foods (created
// by the "use existing food" option) that have been removed from the meal.
//
// Case 1: an existing food id becomes invalid if the food is removed from the meal
//         before the associated food prompt is completed (e.g., deleted via the side panel)

// Case 2: a prompt state restored from local storage refers to an invalid food id
//         (covered by the 'immediate' option)
watch(
  () => props.meal.foods,
  (newFoods) => {
    for (let i = 0; i < promptStates.value.length; ++i) {
      const prompt = promptStates.value[i];

      const update = {
        ...prompt,
        foods: prompt.foods.filter(food =>
          food.type === 'existing' ? newFoods?.some(f => f.id === food.existingFoodId) : true,
        ),
      };

      promptStates.value.splice(i, 1, update);
    }
  },
  { deep: true, immediate: true },
);

function showFoodChooser(promptIndex: number): boolean {
  const prompt = promptStates.value[promptIndex];

  const existingConfirmed = !availableFoods.value[promptIndex].length || prompt.existing !== undefined;

  return !!(
    replaceFoodIndex.value[promptIndex] !== undefined
    || (prompt.mainFoodConfirmed && !prompt.foods.length && existingConfirmed)
    || (prompt.additionalFoodConfirmed && existingConfirmed)
  );
};

function showMoreFoodsQuestion(promptIndex: number): boolean {
  const associatedPrompt = props.prompts[promptIndex];
  const state = promptStates.value[promptIndex];

  return !!(
    !associatedPrompt.foodCode
    && allowMultiple(associatedPrompt)
    && state.mainFoodConfirmed
    && state.foods.length > 0
    && replaceFoodIndex.value[promptIndex] === undefined
  );
};

function associatedFoodDescription(food: AssociatedFoodPromptItem): string {
  if (food.type === 'selected' && food.selectedFood !== undefined)
    return food.selectedFood.name;
  if (food.type === 'existing' && food.existingFoodId !== undefined)
    return existingFoodDescription(food.existingFoodId);
  if (food.type === 'missing')
    return t(`prompts.${type.value}.missing.placeholder`);
  return 'No food selected';
};

function existingFoodDescription(foodId: string): string {
  const food = props.meal?.foods.find(food => food.id === foodId);
  return food ? getFoodDescription(food) : '';
};

function replaceFood(promptIndex: number, foodIndex: number) {
  if (promptStates.value[promptIndex].foods[foodIndex].type === 'existing') {
    promptStates.value[promptIndex].foods.splice(foodIndex, 1);

    updatePrompts();
    return;
  }

  replaceFoodIndex.value.splice(promptIndex, 1, foodIndex);
};

function removeFood(promptIndex: number, foodIndex: number) {
  promptStates.value[promptIndex].foods.splice(foodIndex, 1);

  updatePrompts();
};

function foodSelected(food: FoodHeader, promptIndex: number): void {
  onFoodSelected({ type: 'selected', selectedFood: food }, promptIndex);
};

function existingFoodSelected(foodId: string, promptIndex: number) {
  onFoodSelected({ type: 'existing', existingFoodId: foodId }, promptIndex);
};

function foodMissing(promptIndex: number) {
  onFoodSelected({ type: 'missing' }, promptIndex);
};

function onFoodSelected(selectedFood: AssociatedFoodPromptItem, promptIndex: number): void {
  const state = promptStates.value[promptIndex];
  const replaceIndex = replaceFoodIndex.value[promptIndex];

  if (replaceIndex !== undefined) {
    state.foods.splice(replaceIndex, 1, selectedFood);
    replaceFoodIndex.value.splice(promptIndex, 1);
  }
  else {
    state.foods.push(selectedFood);
  }

  if (allowMultiple(props.prompts[promptIndex])) {
    if (state.additionalFoodConfirmed)
      state.additionalFoodConfirmed = undefined;

    if (state.existing !== undefined)
      state.existing = undefined;
  }

  goToNextIfCan(promptIndex);
  updatePrompts();
};

function onConfirmStateChanged(index: number) {
  const prompt = props.prompts[index];
  const state = promptStates.value[index];

  if (state.mainFoodConfirmed === false) {
    promptStates.value[index] = { ...state, existing: undefined, additionalFoodConfirmed: allowMultiple(prompt) ? undefined : false, foods: [] };
    replaceFoodIndex.value[index] = undefined;
  }

  if (state.mainFoodConfirmed && prompt.foodCode && !state.foods.length) {
    foodSelected(
      { id: prompt.id, code: prompt.foodCode, name: translate(prompt.genericName) },
      index,
    );
  }

  goToNextIfCan(index);
};

function onMultipleFoodConfirm(index: number) {
  const state = promptStates.value[index];

  if (state.additionalFoodConfirmed === false)
    state.existing = undefined;

  goToNextIfCan(index);
};

function goToNextIfCan(index: number) {
  if (!isPromptValid(promptStates.value[index]))
    return;

  activePrompt.value = getNextPrompt(promptStates.value);
};

function updatePrompts() {
  emit('update:modelValue', { activePrompt: activePrompt.value, promptStates: promptStates.value });
};
</script>

<style lang="scss" scoped>
</style>
