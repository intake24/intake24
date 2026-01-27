import type { Ref, SetupContext } from 'vue';

import type { Prompts, PromptStates } from '@intake24/common/prompts';

import { ref } from 'vue';

import { merge } from '@intake24/common/util';
import { getOrCreatePromptStateStore, useSurvey } from '@intake24/survey/stores';
import { findMeal, mealPortionSizeComplete } from '@intake24/survey/util';

export type UsePromptHandlerStoreProps<P extends keyof PromptStates> = {
  prompt: Prompts[P];
};
export function usePromptHandlerStore<P extends keyof PromptStates, S extends PromptStates[P]>(props: UsePromptHandlerStoreProps<P>, { emit }: Pick<SetupContext<'action'[]>, 'emit'>, getInitialState: () => S, commitAnswer?: () => void) {
  const promptStore = getOrCreatePromptStateStore<S>(props.prompt.component)();
  const survey = useSurvey();

  const getFoodId = () => {
    const foodId = survey.selectedFoodOptional?.id;
    if (foodId === undefined)
      throw new Error('This prompt requires a food to be selected');

    return foodId;
  };

  const getMealId = () => {
    const mealId = survey.selectedMealOptional?.id;
    if (mealId === undefined)
      throw new Error('This prompt requires a meal to be selected');

    return mealId;
  };

  const getFoodOrMealId = props.prompt.component === 'edit-meal-prompt' ? getMealId : getFoodId;

  const storedState: S | undefined
    = promptStore.prompts[getFoodOrMealId()]?.[props.prompt.component];

  const state = ref(
    storedState ? merge<S>(getInitialState(), storedState) : getInitialState(),
  ) as Ref<S>;

  const update = (data: S) => {
    promptStore.updateState(getFoodOrMealId(), props.prompt.id, data);
  };

  const clearStoredState = () => {
    promptStore.clearState(getFoodOrMealId(), props.prompt.id);
  };

  const clearStoredStateById = (foodOrMealId: string) => {
    promptStore.clearState(foodOrMealId, props.prompt.id);
  };

  const changePortionSizeMethod = (idx: unknown) => {
    if (typeof idx !== 'number') {
      console.warn('Invalid portion size method index', idx);
      return;
    }

    const foodId = getFoodId();

    survey.updateFood({ foodId, update: { portionSizeMethodIndex: idx, portionSize: null } });
    survey.addFoodFlag(foodId, 'portion-size-option-complete');
    survey.removeFoodFlag(foodId, 'portion-size-method-complete');
    clearStoredState();
  };

  const commitPortionSize = () => {
    if (!('portionSize' in state.value))
      throw new Error('This prompt does not support portion size method');

    const { portionSize } = state.value;
    const foodId = getFoodId();
    const meal = findMeal(survey.meals, getMealId());

    const portionSizeCompleteBefore = mealPortionSizeComplete(meal);

    survey.updateFood({ foodId, update: { portionSize } });
    survey.addFoodFlag(foodId, 'portion-size-method-complete');

    const portionSizeCompleteAfter = mealPortionSizeComplete(meal);

    // If this was the last remaining portion size, reset the selection to
    // the first food of the meal for the associated food prompts second pass

    if (portionSizeCompleteAfter && !portionSizeCompleteBefore)
      survey.setSelection({ mode: 'auto', element: { type: 'food', foodId: meal.foods[0].id } });
  };

  const action = (type: string, ...args: [id?: string, params?: object]) => {
    if (type === 'changeMethod') {
      changePortionSizeMethod(args.at(0));
      emit('action', 'next');
      return;
    }

    if (type === 'next' && commitAnswer)
      commitAnswer();

    emit('action', type, ...args);
  };

  const actionPortionSize = (type: string, ...args: [id?: string | number, params?: object]) => {
    if (type === 'changeMethod') {
      changePortionSizeMethod(args.at(0));
      emit('action', 'next');
      return;
    }

    if (type === 'next')
      commitPortionSize();

    emit('action', type, ...args);
  };

  return {
    state,
    promptStore,
    getFoodId,
    getMealId,
    getFoodOrMealId,
    update,
    clearStoredState,
    clearStoredStateById,
    action,
    actionPortionSize,
    commitPortionSize,
  };
}
