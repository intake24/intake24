<template>
  <component
    :is="prompt.component"
    v-model="state"
    v-bind="{
      food,
      localeId,
      meal,
      prompt,
      section,
      surveySlug,
    }"
    @action="action"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import type { FoodBuilderIngredientStepState, FoodBuilderStepState, PromptStates } from '@intake24/common/prompts';
import type { EncodedFood, MissingFood } from '@intake24/common/surveys';
import type { FoodBuilderStep } from '@intake24/common/types/http/admin';

import { GenericBuilderPrompt, RecipeBuilderPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';
import { getEntityId } from '@intake24/survey/util';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

type FoodBuilderPromptType = 'generic-builder-prompt' | 'recipe-builder-prompt';

defineOptions({ components: { RecipeBuilderPrompt, GenericBuilderPrompt } });

const props = defineProps(createHandlerProps<FoodBuilderPromptType>());

const emit = defineEmits(['action']);

function initialPromptState(step: FoodBuilderStep): FoodBuilderStepState {
  switch (step.type) {
    case 'coefficient':
      return {
        type: step.type,
        option: null,
      };
    case 'condition':
      return {
        type: step.type,
        option: null,
      };
    case 'ingredient':
      return {
        type: step.type,
        confirmed: undefined,
        anotherFoodConfirmed: undefined,
        foods: [],
      };
    case 'lookup-resource':
      return {
        type: step.type,
        option: null,
      };
    case 'lookup-unit':
      return {
        type: step.type,
        option: null,
      };
    case 'quantity':
      return {
        type: step.type,
        quantity: 1,
        confirmed: false,
      };
  }
}

const survey = useSurvey();
const { foodBuilder: food, localeId, surveySlug, resolvePortionSize } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();

const foodId = food.value.id;

function getInitialState(): PromptStates[FoodBuilderPromptType] {
  const steps = food.value.template.steps.map(step => initialPromptState(step));

  switch (props.prompt.component) {
    case 'generic-builder-prompt':
      return {
        food: null,
        portionSize: {
          method: 'standard-portion',
          unit: null,
          quantity: 1,
          linkedQuantity: 1,
          servingWeight: 0,
          leftoversWeight: 0,
        },
        steps,
        activeStep: 0,
      };
    case 'recipe-builder-prompt':
      return {
        steps: steps as FoodBuilderIngredientStepState[],
        activeStep: 0,
      };
  }
}

const { state, update, clearStoredState } = usePromptHandlerStore(props, { emit }, getInitialState);

function commitAnswer() {
  const ingredients: (EncodedFood | MissingFood)[] = (state.value.steps
    .filter(step => step.type === 'ingredient' && step.confirmed !== 'no') as FoodBuilderIngredientStepState[])
    .flatMap(({ foods }) => foods)
    .map((item) => {
      const id = getEntityId();

      if (item.type === 'missing') {
        return {
          id,
          type: 'missing-food',
          info: null,
          searchTerm: item.name,
          customPromptAnswers: {},
          flags: [],
          linkedFoods: [],
        };
      }

      const { flags, portionSizeMethodIndex, portionSize } = resolvePortionSize(item.ingredient, 'recipe', food.value);
      flags.push('associated-foods-complete');

      return {
        id,
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

  if ('food' in state.value && state.value.food) {
    const mainFood: EncodedFood = {
      id: foodId,
      type: 'encoded-food',
      data: state.value.food,
      searchTerm: `food-builder:${food.value.template.type}:${food.value.template.code}`,
      flags: ['associated-foods-complete', 'food-builder-complete', 'portion-size-option-complete', 'portion-size-method-complete'],
      portionSizeMethodIndex: 0,
      portionSize: state.value.portionSize,
      customPromptAnswers: {},
      linkedFoods: ingredients,
    };

    survey.replaceFood({ foodId, food: mainFood });
  }
  else {
    survey.updateFood({ foodId, update: { linkedFoods: [...food.value.linkedFoods, ...ingredients] } });
    survey.addFoodFlag(foodId, ['associated-foods-complete', 'food-builder-complete', 'portion-size-option-complete', 'portion-size-method-complete']);
  }

  clearStoredState();
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commitAnswer();

  emit('action', type, ...args);
}
</script>
