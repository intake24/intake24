<template>
  <recipe-builder-prompt
    v-model="state"
    v-bind="{
      food: recipeBuilder,
      localeId,
      surveySlug,
      meal,
      prompt,
      section,
    }"
    @action="action"
    @add-food="addingIngredientsAsALinkedFood"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import type { FoodRecipeBuilderItemState, PromptStates, RecipeBuilderStepState } from '@intake24/common/prompts';
import type { EncodedFood, MissingFood } from '@intake24/common/surveys';
import type { FoodBuilder } from '@intake24/common/types/http';

import { RecipeBuilderPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'recipe-builder-prompt'>());

const emit = defineEmits(['action']);

function initialPromptState(step: FoodBuilder['steps'][number]): RecipeBuilderStepState {
  switch (step.type) {
    case 'ingredient':
      return {
        confirmed: undefined,
        anotherFoodConfirmed: undefined,
        foods: [],
        categoryCode: step.categoryCode,
        name: step.name,
        description: step.description,
        required: step.required,
        multiple: step.multiple,
      };
    default:
      throw new Error(`Unsupported recipe builder step type: ${step.type}`);
  }
}

const survey = useSurvey();
const { recipeBuilder, localeId, surveySlug, resolvePortionSize } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();

const foodBuilder = recipeBuilder.value.template;
const foodId = recipeBuilder.value.id;

function getInitialState(): PromptStates['recipe-builder-prompt'] {
  return {
    recipe: foodBuilder,
    activeStep: 0,
    recipeSteps: foodBuilder.steps.map(step => initialPromptState(step)),
  };
}

const { state, update, clearStoredState } = usePromptHandlerStore(props, { emit }, getInitialState);

async function addingIngredientsAsALinkedFood(ingredients: FoodRecipeBuilderItemState[]) {
  const foods: (EncodedFood | MissingFood)[] = ingredients.map((item) => {
    if (item.type === 'missing') {
      return {
        id: item.id,
        type: 'missing-food',
        info: null,
        searchTerm: item.name,
        customPromptAnswers: {},
        flags: [],
        linkedFoods: [],
      };
    }
    const { flags, portionSizeMethodIndex, portionSize } = resolvePortionSize(item.ingredient, 'recipe', recipeBuilder.value);
    flags.push('associated-foods-complete');

    return {
      id: item.id,
      type: 'encoded-food',
      data: item.ingredient,
      searchTerm: item.searchTerm ?? null,
      flags,
      portionSizeMethodIndex,
      portionSize,
      customPromptAnswers: {},
      linkedFoods: [],
    };
  });

  console.log('linkedFoods length', recipeBuilder.value.linkedFoods.length);
  console.log('linkedFoods', recipeBuilder.value.linkedFoods);
  console.log('foods length', foods.length);
  console.log('foods', foods);

  survey.updateFood({ foodId, update: { linkedFoods: [...recipeBuilder.value.linkedFoods, ...foods] } });

  commitAnswer();
}

function commitAnswer() {
  survey.addFoodFlag(foodId, [
    'portion-size-method-complete',
    'recipe-builder-complete',
    'associated-foods-complete',
  ]);
  clearStoredState();
  emit('action', 'next');
}

async function action(type: string) {
  if (type === 'next')
    commitAnswer();
  else console.log('Unhandled action', type);
}
</script>
