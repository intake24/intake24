<template>
  <base-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-expansion-panels v-model="activePrompt" :tile="$vuetify.display.mobile" @update:model-value="updatePrompts">
      <v-expansion-panel v-for="(promptState, index) in promptStates" :key="index">
        <v-expansion-panel-title>
          {{ promptHeader(index) }}
          <template #actions>
            <expansion-panel-actions :valid="isPromptValid(promptState)" />
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
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
              v-if="
                !associatedFoodPrompts[index].foodCode
                  && promptState.mainFoodConfirmed
                  && promptState.foods.length > 0
                  && !showFoodChooser(index)
              "
            >
              <v-card
                v-for="(foodItem, foodIndex) in promptState.foods"
                :key="foodIndex"
                class="mb-3"
                color="grey-lighten-4"
                flat
              >
                <v-card-text class="px-4 py-4 py-sm-2">
                  <v-row align="center" class="gr-4" justify="space-between" no-gutters>
                    <v-col class="text-h6" cols="12" sm="auto">
                      <v-icon icon="$food" start />
                      {{ associatedFoodDescription(foodItem) }}
                    </v-col>
                    <v-col class="d-flex flex-column ga-1" cols="12" sm="auto">
                      <v-btn
                        color="primary"
                        :title="promptI18n['select.different']"
                        variant="flat"
                        @click="replaceFood(index, foodIndex)"
                      >
                        <v-icon icon="$edit" start />
                        {{ promptI18n['select.different'] }}
                      </v-btn>
                      <confirm-dialog
                        v-if="allowMultiple && associatedFoodPrompts[index].multiple"
                        :label="promptI18n['select.remove']"
                        @confirm="removeFood(index, foodIndex)"
                      >
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            color="error"
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
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </div>
          </v-expand-transition>

          <!-- Additional food confirmation -->
          <v-expand-transition>
            <v-card v-show="showMoreFoodsQuestion(index)" flat>
              <v-card-title>{{ promptI18n.moreFoodsQuestion }}</v-card-title>
              <v-card-text>
                <v-radio-group
                  v-model="promptState.additionalFoodConfirmed"
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
                    :label="promptI18n.yesAnother"
                    true-icon="$yes"
                    :value="true"
                  />
                </v-radio-group>
              </v-card-text>
            </v-card>
          </v-expand-transition>

          <!-- Existing food option: if there are any foods in the same meal that match
            the associated food criteria, allow to pick one of them -->
          <v-expand-transition>
            <v-card v-if="showFoodChooser(index) && availableFoods[index].length" flat>
              <v-card-title class="px-0 font-weight-regular">
                {{ promptI18n.existingFoodsTitle }}
              </v-card-title>
              <v-card-text class="px-0">
                <meal-food-chooser
                  v-if="meal"
                  :filter="(id) => availableFoods[index].includes(id)"
                  :meal-id="meal.id"
                  @selected="(id) => existingFoodSelected(id, index)"
                />
              </v-card-text>
            </v-card>
          </v-expand-transition>

          <!-- Database lookup -->
          <v-expand-transition>
            <v-card v-if="showFoodChooser(index)" flat>
              <v-card-title class="px-0 font-weight-regular">
                {{
                  availableFoods[index].length
                    ? promptI18n.databaseLookupWithExisting
                    : promptI18n.databaseLookupTitle
                }}
              </v-card-title>
              <v-card-text class="px-0">
                <food-browser
                  v-bind="{
                    localeId,
                    surveySlug,
                    prompt,
                    rootCategory: associatedFoodPrompts[index].categoryCode,
                    section,
                    includeHidden: true,
                  }"
                  @food-missing="foodMissing(index)"
                  @food-selected="(food) => foodSelected(food, index)"
                />
              </v-card-text>
            </v-card>
          </v-expand-transition>
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
import { computed, ref, watch } from 'vue';
import type {
  AssociatedFoodPrompt,
  AssociatedFoodPromptItem,
  PromptStates,
} from '@intake24/common/prompts';
import type { EncodedFood } from '@intake24/common/surveys';
import { getFoodDescription } from '@intake24/common/surveys';
import type { FoodHeader, UserAssociatedFoodPrompt } from '@intake24/common/types/http';
import { useI18n } from '@intake24/i18n';
import { ExpansionPanelActions, FoodBrowser } from '@intake24/survey/components/elements';
import { MealFoodChooser, useScrollToPanel } from '@intake24/survey/components/prompts/partials';
import { usePromptUtils } from '@intake24/survey/composables';
import { ConfirmDialog } from '@intake24/ui';
import { BaseLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'associated-foods-prompt'>(),
  food: {
    type: Object as PropType<EncodedFood>,
    required: true,
  },
  prompts: {
    type: Array as PropType<Array<UserAssociatedFoodPrompt>>,
    required: true,
  },
  localeId: {
    type: String,
    required: true,
  },
  surveySlug: {
    type: String,
  },
  modelValue: {
    type: Object as PropType<PromptStates['associated-foods-prompt']>,
    required: true,
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
    'existingFoodHint',
    'yes',
    'yesAnother',
    'no',
    'moreFoodsQuestion',
    'databaseLookupTitle',
    'databaseLookupWithExisting',
    'existingFoodsTitle',
    'select.different',
    'select.remove',
  ]),
);

const activePrompt = ref(props.modelValue.activePrompt);
useScrollToPanel(activePrompt);

const promptStates = ref(props.modelValue.promptStates);
const replaceFoodIndex = ref(props.prompts.map(() => undefined as number | undefined));
const allowMultiple = computed(() => props.prompt.multiple);

const associatedFoodPrompts = computed(() => props.prompts);
const isValid = computed(() => promptStates.value.every(isPromptValid));
const usedExistingFoodIds = computed(() => promptStates.value.flatMap(prompt =>
  prompt.foods
    .filter(food => food.type === 'existing' && food.existingFoodId !== undefined)
    .map(food => food.existingFoodId!),
));

const availableFoods = computed(() => {
  const foodsInThisMeal = props.meal?.foods ?? [];

  return associatedFoodPrompts.value.map((prompt) => {
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
  () => props.meal?.foods,
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

function promptHeader(index: number): string {
  const promptText = translate(associatedFoodPrompts.value[index].promptText);
  if (availableFoods.value[index].length > 0)
    return `${promptText} ${promptI18n.value.existingFoodHint}`;
  else
    return promptText;
};

function showFoodChooser(promptIndex: number): boolean {
  const prompt = promptStates.value[promptIndex];

  return !!(
    replaceFoodIndex.value[promptIndex] !== undefined
    || (prompt.mainFoodConfirmed && !prompt.foods.length)
    || prompt.additionalFoodConfirmed
  );
};

function showMoreFoodsQuestion(promptIndex: number): boolean {
  const associatedPrompt = associatedFoodPrompts.value[promptIndex];
  const state = promptStates.value[promptIndex];

  return !!(
    !associatedPrompt.foodCode
    && allowMultiple.value
    && associatedFoodPrompts.value[promptIndex].multiple
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
  replaceFoodIndex.value.splice(promptIndex, 1, foodIndex);
};

function removeFood(promptIndex: number, foodIndex: number) {
  const state = promptStates.value[promptIndex];

  const update = {
    ...state,
    foods: state.foods.slice(0, foodIndex).concat(state.foods.slice(foodIndex + 1)),
  };

  promptStates.value.splice(promptIndex, 1, update);

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

  const foods = state.foods.slice();

  if (replaceIndex !== undefined) {
    foods[replaceIndex] = selectedFood;
    replaceFoodIndex.value.splice(promptIndex, 1);
  }
  else {
    foods.push(selectedFood);
  }

  const update = {
    ...state,
    additionalFoodConfirmed:
          state.additionalFoodConfirmed === true ? undefined : state.additionalFoodConfirmed,
    foods,
  };

  promptStates.value.splice(promptIndex, 1, update);

  goToNextIfCan(promptIndex);
  updatePrompts();
};

function onConfirmStateChanged(index: number) {
  const prompt = associatedFoodPrompts.value[index];
  const state = promptStates.value[index];
  if (state.mainFoodConfirmed && prompt.foodCode && !state.foods.length) {
    foodSelected(
      { id: prompt.id, code: prompt.foodCode, name: translate(prompt.genericName) },
      index,
    );
  }

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
