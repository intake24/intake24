import type { MealState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { useSurvey } from '@intake24/survey/stores';

export function requireMeal(meal: MealState | undefined): MealState {
  if (meal === undefined)
    throw new Error('Expected a meal to be selected');
  return meal;
}

export function useMealPromptUtils() {
  const survey = useSurvey();

  const meal = computed(() => requireMeal(survey.selectedMealOptional));
  const mealOptional = computed(() => survey.selectedMealOptional);

  return { meal, mealOptional };
}
