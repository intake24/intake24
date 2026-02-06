<template>
  <component
    :is="prompt.component"
    v-model="state"
    v-bind="{
      food,
      localeId,
      surveySlug,
      meal,
      prompt,
      section,
    }"
    @action="action"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import type { FoodBuilderIngredientStepState, FoodBuilderStepState, PromptStates } from '@intake24/common/prompts';
import type { EncodedFood, MissingFood } from '@intake24/common/surveys';
import type { FoodBuilder } from '@intake24/common/types/http';

import { GenericBuilderPrompt, RecipeBuilderPrompt } from '@intake24/survey/components/prompts';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, useFoodPromptUtils, useMealPromptUtils, usePromptHandlerStore } from '../composables';

type FoodBuilderPromptType = 'generic-builder-prompt' | 'recipe-builder-prompt';

defineOptions({ components: { RecipeBuilderPrompt, GenericBuilderPrompt } });

const props = defineProps(createHandlerProps<FoodBuilderPromptType>());

const emit = defineEmits(['action']);

function initialPromptState(step: FoodBuilder['steps'][number]): FoodBuilderStepState {
  switch (step.type) {
    case 'coefficient':
      return {
        id: step.id,
        type: step.type,
        name: step.name,
        description: step.description,
        options: step.options,
        option: null,
      };
    case 'condition':
      return {
        id: step.id,
        type: step.type,
        name: step.name,
        description: step.description,
        options: step.options,
        option: null,
      };
    case 'ingredient':
      return {
        id: step.id,
        type: step.type,
        name: step.name,
        description: step.description,
        categoryCode: step.categoryCode,
        multiple: step.multiple,
        required: step.required,
        confirmed: undefined,
        anotherFoodConfirmed: undefined,
        foods: [],
      };
    case 'lookup':
      return {
        id: step.id,
        type: step.type,
        name: step.name,
        description: step.description,
        resource: step.resource,
        options: step.options,
        option: null,
      };
  }
}

const survey = useSurvey();
const { foodBuilder: food, localeId, surveySlug, resolvePortionSize } = useFoodPromptUtils();
const { meal } = useMealPromptUtils();

const foodData = food.value.template;
const foodId = food.value.id;

function getInitialState(): PromptStates[FoodBuilderPromptType] {
  return {
    builder: foodData,
    steps: foodData.steps.map(step => initialPromptState(step)),
    activeStep: 0,
  };
}

const { state, update, clearStoredState } = usePromptHandlerStore(props, { emit }, getInitialState);

function commitAnswer() {
  if (state.value.builder.type !== 'recipe')
    throw new Error(`Unsupported food builder type: ${state.value.builder.type}`);

  const foods: (EncodedFood | MissingFood)[] = (state.value.steps
    .filter(step => step.type === 'ingredient' && step.confirmed !== 'no') as FoodBuilderIngredientStepState[])
    .flatMap(({ foods }) => foods)
    .map((item) => {
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

      const { flags, portionSizeMethodIndex, portionSize } = resolvePortionSize(item.ingredient, 'recipe', food.value);
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

  survey.updateFood({ foodId, update: { linkedFoods: [...food.value.linkedFoods, ...foods] } });
  survey.addFoodFlag(foodId, ['portion-size-method-complete', 'food-builder-complete', 'associated-foods-complete']);
  clearStoredState();

  emit('action', 'next');
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commitAnswer();

  emit('action', type, ...args);
}
</script>
