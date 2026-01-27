import type { SetupContext } from 'vue';

import type { FoodActionType, GenericActionType, MealActionType } from '@intake24/common/prompts';
import type { MealState } from '@intake24/common/surveys';

import { computed } from 'vue';

import { useSurvey } from '@intake24/survey/stores';
import { getFoodIndexRequired } from '@intake24/survey/util';

export type UseMealListProps = {
  meals: MealState[];
};

export function useMealList(props: UseMealListProps, { emit }: Pick<SetupContext<'action'[]>, 'emit'>) {
  const survey = useSurvey();

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

  const action = (type: FoodActionType | MealActionType | GenericActionType, id?: string) => {
    emit('action', type, id);
  };

  return {
    selectedMealId,
    selectedFoodId,
    isSelectedFoodInMeal,
    action,
  };
}
