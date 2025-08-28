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
import type { EncodedFood, FoodFlag, MissingFood } from '@intake24/common/surveys';
import type { RecipeFoodStep } from '@intake24/common/types';
import { RecipeBuilderPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';
import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

const props = defineProps(createHandlerProps<'recipe-builder-prompt'>());

const emit = defineEmits(['action']);

function initialPromptState(step: RecipeFoodStep): RecipeBuilderStepState {
  return {
    confirmed: undefined,
    anotherFoodConfirmed: undefined,
    repeat: step.repeatable,
    foods: [],
    order: step.order - 1,
    description: step.description,
    name: step.name,
    categoryCode: step.categoryCode,
    required: step.required,
  };
}

const survey = useSurvey();
const { recipeBuilder, localeId, surveySlug } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();

const recipeFood = recipeBuilder.value.template;
const foodId = recipeBuilder.value.id;

function getInitialState(): PromptStates['recipe-builder-prompt'] {
  return {
    recipe: recipeFood,
    activeStep: 0,
    recipeSteps: recipeFood.steps.map(step => initialPromptState(step)),
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

  const newComponents = [];
  const linkedFood = [];
  const recipeParent = survey.selectedFoodOptional;
  if (recipeParent !== undefined && recipeParent.type === 'recipe-builder') {
    newComponents.push(...recipeParent.components);
    linkedFood.push(...recipeParent.linkedFoods);
  }

  // adding the new ingredient to existing component or creating a new one.
  const componentIndex = newComponents[data.idx] !== undefined ? data.idx : -1;
  if (componentIndex !== -1 && newComponents.length > 0)
    newComponents[componentIndex].ingredients.push(data.id);
  else
    newComponents.push({ order: data.idx, ingredients: [data.id] });

  survey.updateFood({
    foodId,
    update: { linkedFoods: [...linkedFood, ingredientToAdd], components: [...newComponents] },
  });
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
