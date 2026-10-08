<template>
  <meal-description-prompt
    v-model="state"
    v-bind="{ meal, prompt, section, loading, rejected }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import type { FreeTextFood } from '@intake24/common/surveys';
import type { MealDescriptionFood, MealDescriptionParseResponse } from '@intake24/common/types/http';

import { computed, ref } from 'vue';

import { MealDescriptionPrompt } from '@intake24/survey/components/prompts/standard';
import { surveyService } from '@intake24/survey/services';
import { useSurvey } from '@intake24/survey/stores';
import { getEntityId } from '@intake24/survey/util';

import { createHandlerProps, useMealPromptUtils, usePromptHandlerNoStore } from '../composables';

const props = defineProps(createHandlerProps<'meal-description-prompt'>());

const emit = defineEmits(['action']);

const { meal } = useMealPromptUtils();
const survey = useSurvey();

const loading = ref(false);
const rejected = ref(false);
const parsedFoods = ref<MealDescriptionFood[]>([]);

const getInitialState = computed(() => '');

async function parseDescription(surveySlug: string, description: string): Promise<MealDescriptionParseResponse> {
  try {
    return await surveyService.parseMealDescription(surveySlug, description, props.prompt.timeout * 1000);
  }
  catch {
    // Any failure (not configured, timeout, provider or validation error) falls back to an empty meal,
    // so that edit-meal-prompt shows the regular list editor.
    // TODO: fall back to a simple local parser (e.g. split on new lines and commas) instead of dropping the input
    return { status: 'parsed', foods: [] };
  }
}

function commitAnswer() {
  const mealId = meal.value.id;

  const foods = parsedFoods.value.map<FreeTextFood>(({ description, isDrink }) => ({
    id: getEntityId(),
    type: 'free-text',
    description,
    flags: isDrink ? ['is-drink'] : [],
    customPromptAnswers: {},
    linkedFoods: [],
  }));

  survey.setFoods({ mealId, foods });
  survey.addMealFlag(mealId, 'meal-description-complete');

  // Same flag edit-meal-prompt sets on confirmation; an empty meal must still go through edit-meal-prompt
  if (!props.prompt.reviewFoods && foods.length)
    survey.addMealFlag(mealId, 'free-entry-complete');
}

const { state, action: baseAction } = usePromptHandlerNoStore({ emit }, getInitialState, commitAnswer);

async function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next') {
    const surveySlug = survey.slug;
    if (!surveySlug)
      throw new Error('Survey parameters must be loaded before parsing meal description');

    loading.value = true;
    rejected.value = false;
    const result = await parseDescription(surveySlug, state.value);
    loading.value = false;

    if (result.status === 'rejected') {
      rejected.value = true;
      return;
    }

    parsedFoods.value = result.foods;
  }

  baseAction(type, ...args);
}
</script>

<style scoped></style>
