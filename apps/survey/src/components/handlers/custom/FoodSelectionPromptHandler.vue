<template>
  <food-selection-prompt
    v-model="state"
    v-bind="{ filteredFoods, meal, prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import type { FoodState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { dynamicFoodFlag } from '@intake24/common/surveys';
import { foodSelectionNoneUuid, FoodSelectionPrompt } from '@intake24/survey/components/prompts/custom';
import { filterFoodsForFoodSelectionPrompt } from '@intake24/survey/dynamic-recall/prompt-filters';
import { useSurvey } from '@intake24/survey/stores';
import { flagPromptCompletionFlag } from '@intake24/survey/util';

import { createHandlerProps, usePromptHandlerNoStore } from '../composables';
import { useMealPromptUtils } from '../composables/use-meal-prompt-utils';

const props = defineProps(createHandlerProps<'food-selection-prompt'>());

const emit = defineEmits(['action']);

const surveyStore = useSurvey();
const { meal } = useMealPromptUtils();

const parsedFlag = computed(() => {
  try {
    return dynamicFoodFlag.parse(props.prompt.flag);
  }
  catch (e: any) {
    console.warn(`Invalid food flag in ${props.prompt.component} (${props.prompt.id}): "${props.prompt.flag}" (${e.message})`);
    return undefined;
  }
});

const filteredFoods = computed(() => filterFoodsForFoodSelectionPrompt(surveyStore, meal.value, props.prompt));

function isFoodSelected(food: FoodState): boolean {
  if (props.prompt.useFlag) {
    return parsedFlag.value ? food.flags.includes(parsedFlag.value) : false;
  }
  else {
    return food.customPromptAnswers[props.prompt.id] !== undefined;
  }
}

const getInitialState = computed(() => meal.value.foods.filter(food => isFoodSelected(food)).map(food => food.id));

// TODO: use store for intermediate state
const { state } = usePromptHandlerNoStore({ emit }, getInitialState);

function commitAnswer() {
  function commitAnswers(food: FoodState) {
    const selected = state.value.includes(food.id) && !state.value.includes(foodSelectionNoneUuid);

    if (props.prompt.useFlag && props.prompt.flag) {
      surveyStore.addFoodFlag(food.id, flagPromptCompletionFlag(props.prompt.flag));

      if (parsedFlag.value !== undefined)
        surveyStore.setFoodFlag(food.id, parsedFlag.value, selected);
    }
    else {
      surveyStore.setFoodCustomPromptAnswer({ foodId: food.id, promptId: props.prompt.id, answer: selected });
    }
  }

  for (const food of meal.value.foods) {
    commitAnswers(food);
  }

  surveyStore.addMealFlag(meal.value.id, `${props.prompt.id}-complete`);
}

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next') {
    commitAnswer();
    emit('action', type);
    return;
  }
  emit('action', type, ...args);
}
</script>

<style scoped></style>
