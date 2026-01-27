<template>
  <food-search-prompt
    v-bind="{ discardedFoodName, food, meal, localeId, surveySlug, prompt, section }"
    v-model="searchTerm"
    @action="action"
    @food-missing="foodMissing"
    @food-selected="foodSelected"
    @recipe-builder="recipeBuilder"
  />
</template>

<script lang="ts" setup>
import type { EncodedFood, FoodState, MissingFood, RecipeBuilder } from '@intake24/common/surveys';
import type { RecipeFood } from '@intake24/common/types';
import type { UserFoodData } from '@intake24/common/types/http';

import { ref } from 'vue';

import { FoodSearchPrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils } from '../composables';

defineProps(createHandlerProps<'food-search-prompt'>());

const emit = defineEmits(['action']);

function getSearchTerm(foodEntry: FoodState) {
  switch (foodEntry.type) {
    case 'encoded-food':
    case 'missing-food':
    case 'recipe-builder':
      return foodEntry.searchTerm;
    case 'free-text':
      return foodEntry.description;
  }
}

const { food, localeId, surveySlug, initializeRecipeComponents } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();
const survey = useSurvey();

const foodData = ref<UserFoodData | undefined>(undefined);
const searchTerm = ref(getSearchTerm(food.value));
const discardedFoodName = ref<string | null>(null);

const currentState = food.value;

// Warn user if they try to replace an encoded food that already has some portion size
// data associated with it by coming back to the food search prompt using the back or forward
// buttons.
//
// TODO: make sure this cannot result in an invalid survey state some other way, for instance
//       by invalidating custom prompt answers or associated food links.

if (
  currentState.type === 'encoded-food'
  && (currentState.portionSizeMethodIndex !== null || currentState.portionSize !== null)
) {
  discardedFoodName.value = currentState.data.localName;
}
else {
  discardedFoodName.value = null;
}

function getFoodToReplace() {
  const { id, flags } = food.value;

  // Remove appropriate flags if replacing existing not a "free-entry" food
  return {
    id,
    flags: flags.filter(
      flag =>
        ![
          'associated-foods-complete',
          'missing-food-complete',
          'portion-size-method-complete',
          'portion-size-option-complete',
          'recipe-builder-complete',
          'same-as-before-complete',
        ].includes(flag),
    ),
  };
}

function action(type: string, ...args: [id?: string, params?: object]) {
  emit('action', type, ...args);
}

function foodSelected(data: UserFoodData) {
  foodData.value = data;
  commitAnswer();
  action('next');
};

function foodMissing() {
  const { id, flags } = getFoodToReplace();

  const newState: MissingFood = {
    id,
    type: 'missing-food',
    info: null,
    searchTerm: searchTerm.value,
    customPromptAnswers: {},
    flags,
    linkedFoods: [],
  };

  survey.replaceFood({ foodId: id, food: newState });
  action('next');
};

function recipeBuilder(recipeFood: RecipeFood) {
  const { id, flags } = getFoodToReplace();
  const components = initializeRecipeComponents(
    recipeFood.steps.map(step => step.order - 1),
  );

  const newState: RecipeBuilder = {
    id,
    type: 'recipe-builder',
    description: recipeFood.recipeWord,
    searchTerm: searchTerm.value,
    customPromptAnswers: {},
    flags,
    linkedFoods: [],
    templateId: recipeFood.name,
    template: recipeFood,
    markedAsComplete: [],
    components,
  };

  survey.replaceFood({ foodId: id, food: newState });
  action('next');
};

function commitAnswer() {
  if (foodData.value === undefined) {
    console.warn('FoodSearchPromptHandler: foodData is undefined.');
    return;
  }

  const { id, flags } = getFoodToReplace();

  // Assign portion size method if only one is available
  const hasOnePortionSizeMethod = foodData.value.portionSizeMethods.length === 1;
  if (hasOnePortionSizeMethod)
    flags.push('portion-size-option-complete');

  // V4-1393: Custom prompts may depend on the selected food via the conditions system,
  // so transferring custom prompt answers is not valid in the general case.
  //
  // Flags are filtered in getFoodToReplace, which should make this safe, but additional flags
  // may need to be filtered out.

  const newState: EncodedFood = {
    id,
    type: 'encoded-food',
    data: foodData.value,
    searchTerm: searchTerm.value || '',
    portionSizeMethodIndex: hasOnePortionSizeMethod ? 0 : null,
    portionSize: null,
    customPromptAnswers: {},
    flags,
    linkedFoods: [],
  };

  survey.replaceFood({ foodId: id, food: newState });
};
</script>

<style scoped></style>
