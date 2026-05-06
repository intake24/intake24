import type { SetupContext } from 'vue';

import type { ActionType } from '@intake24/common/prompts';
import type { FoodState, MealState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { useSurvey } from '@intake24/survey/stores';
import { getFoodIndexRequired } from '@intake24/survey/util';

export type UseMealListProps = {
  meals: MealState[];
};

export function useMealList(props: UseMealListProps, { emit }: Pick<SetupContext<'action'[]>, 'emit'>) {
  const survey = useSurvey();

  function countLinkedFoods(acc: number, food: FoodState): number {
    if (!food.linkedFoods.length)
      return acc;

    acc += food.linkedFoods.length;
    return food.linkedFoods.reduce(countLinkedFoods, acc);
  }

  const foodCount = computed(() => props.meals.reduce((acc, meal) => {
    acc += meal.foods.length;
    return meal.foods.reduce(countLinkedFoods, acc);
  }, 0));

  const selectedMealId = computed(() => {
    if (survey.selection.element?.type !== 'meal')
      return undefined;
    return survey.selection.element.mealId;
  });

  const selectedFoodId = computed(() => {
    if (survey.selection.element?.type !== 'food')
      return undefined;
    return survey.selection.element.foodId;
  });

  const isSelectedFoodInMeal = (mealId: string) => {
    if (survey.selection.element?.type !== 'food')
      return false;

    const foodIndex = getFoodIndexRequired(props.meals, survey.selection.element.foodId);

    return props.meals[foodIndex.mealIndex].id === mealId;
  };

  const action = (type: ActionType, id?: string, params?: object) => {
    emit('action', type, id, params);
  };

  return {
    foodCount,
    selectedMealId,
    selectedFoodId,
    isSelectedFoodInMeal,
    action,
  };
}
