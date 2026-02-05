<template>
  <generic-builder-prompt
    v-model="state"
    v-bind="{
      food: genericBuilder,
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
import type { EncodedFood, FoodFlag, MissingFood } from '@intake24/common/surveys';
import type { FoodBuilder } from '@intake24/common/types/http';

import { GenericBuilderPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'generic-builder-prompt'>());

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
      throw new Error(`Unsupported food builder step type: ${step.type}`);
  }
}

const survey = useSurvey();
const { genericBuilder, localeId, surveySlug } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();

const foodBuilder = genericBuilder.value.template;
const foodId = genericBuilder.value.id;

function getInitialState(): PromptStates['generic-builder-prompt'] {
  return {
    builder: foodBuilder,
    activeStep: 0,
    steps: foodBuilder.steps.map(step => initialPromptState(step)),
  };
}

const { state, update, clearStoredState } = usePromptHandlerStore(props, { emit }, getInitialState);

async function addingIngredientsAsALinkedFood(ingredients: FoodRecipeBuilderItemState[][]) {
  ingredients.forEach((stepIngredients) => {
    stepIngredients.forEach((ingredient) => {
      addLinkedFood(ingredient);
    });
  });
  commitAnswer();
}

async function addLinkedFood(data: FoodRecipeBuilderItemState) {
  let ingredientToAdd: EncodedFood | MissingFood;
  if (data.type === 'missing') {
    ingredientToAdd = {
      id: data.id,
      type: 'missing-food',
      info: null,
      searchTerm: data.name,
      customPromptAnswers: {},
      flags: [],
      linkedFoods: [],
    };
  }
  else {
    const hasOnePortionSizeMethod = data.ingredient.portionSizeMethods.length === 1;
    const flags: FoodFlag[] = ['associated-foods-complete'];
    if (hasOnePortionSizeMethod)
      flags.push('portion-size-option-complete');

    ingredientToAdd = {
      id: data.id,
      type: 'encoded-food',
      data: data.ingredient,
      searchTerm: data.searchTerm ?? null,
      flags,
      portionSizeMethodIndex: hasOnePortionSizeMethod ? 0 : null,
      portionSize: null,
      customPromptAnswers: {},
      linkedFoods: [],
    };
  }

  const linkedFood = [];
  const recipeParent = survey.selectedFoodOptional;
  if (recipeParent !== undefined && recipeParent.type === 'recipe-builder') {
    linkedFood.push(...recipeParent.linkedFoods);
  }

  survey.updateFood({
    foodId,
    update: { linkedFoods: [...linkedFood, ingredientToAdd] },
  });
}

function commitAnswer() {
  survey.addFoodFlag(foodId, [
    'portion-size-method-complete',
    'generic-builder-complete',
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
