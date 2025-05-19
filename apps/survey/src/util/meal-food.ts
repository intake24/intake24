import type { Prompt } from '@intake24/common/prompts';
import type { FoodState, MealState, Selection, SurveyState } from '@intake24/common/surveys';
import { randomString } from '@intake24/common/util';
import { filterForIncompleteCustomPrompts } from '@intake24/survey/dynamic-recall/prompt-filters';
import type { SurveyStore } from '@intake24/survey/stores';
import type { FoodIndex, MealFoodIndex } from '@intake24/survey/stores/survey';

// Helper to generate unique id for each meal/food with same length
export const getEntityId = () => randomString(12);

export function getFoodIndexInMeal(meal: MealState, id: string): FoodIndex | undefined {
  for (let i = 0; i < meal.foods.length; ++i) {
    if (meal.foods[i].id === id)
      return { foodIndex: i, linkedFoodIndex: undefined };

    for (let li = 0; li < meal.foods[i].linkedFoods.length; ++li) {
      if (meal.foods[i].linkedFoods[li].id === id)
        return { foodIndex: i, linkedFoodIndex: li };
    }
  }

  return undefined;
}

export function getFoodIndex(meals: MealState[], id: string): MealFoodIndex | undefined {
  for (let mi = 0; mi < meals.length; ++mi) {
    const foodIndex = getFoodIndexInMeal(meals[mi], id);

    if (foodIndex !== undefined)
      return { mealIndex: mi, ...foodIndex };
  }

  return undefined;
}

export function getMealIndex(meals: MealState[], id: string): number | undefined {
  for (let mi = 0; mi < meals.length; ++mi) {
    if (meals[mi].id === id)
      return mi;
  }

  return undefined;
}

export function getMealIndexRequired(meals: MealState[], id: string): number {
  const mealIndex = getMealIndex(meals, id);

  if (mealIndex === undefined)
    throw new Error(`Meal with id ${id} not found`);

  return mealIndex;
}

export function getFoodIndexRequired(meals: MealState[], id: string): MealFoodIndex {
  const foodIndex = getFoodIndex(meals, id);

  if (foodIndex === undefined)
    throw new Error(`Food with id ${id} not found`);

  return foodIndex;
}

export function getFoodByIndex(meals: MealState[], foodIndex: MealFoodIndex): FoodState {
  return foodIndex.linkedFoodIndex === undefined
    ? meals[foodIndex.mealIndex].foods[foodIndex.foodIndex]
    : meals[foodIndex.mealIndex].foods[foodIndex.foodIndex].linkedFoods[foodIndex.linkedFoodIndex];
}

export function findFood(meals: MealState[], id: string): FoodState {
  const foodIndex = getFoodIndexRequired(meals, id);
  return getFoodByIndex(meals, foodIndex);
}

export function findMeal(meals: MealState[], id: string): MealState {
  const mealIndex = getMealIndexRequired(meals, id);

  return meals[mealIndex];
}

export function foodPortionSizeComplete(food: FoodState) {
  switch (food.type) {
    case 'free-text':
      return false;
    case 'encoded-food':
      return food.portionSize !== null && food.flags.includes('portion-size-method-complete');
    case 'missing-food':
      return food.info !== null && food.flags.includes('missing-food-complete');
    case 'recipe-builder':
      // FIXME: correct completeness check for recipe builder
      return food.flags.includes('recipe-builder-complete');
  }
}

export function associatedFoodPromptsComplete(food: FoodState) {
  return (
    food.type === 'encoded-food'
    && (food.flags.includes('associated-foods-complete') || !food.data.associatedFoodPrompts.length)
  );
}

export function encodedFoodComplete(food: FoodState) {
  return foodPortionSizeComplete(food) && associatedFoodPromptsComplete(food);
}

export function missingFoodComplete(food: FoodState) {
  return food.type === 'missing-food' && !!food.info && food.flags.includes('missing-food-complete');
}

export function recipeBuilderComplete(food: FoodState) {
  return food.type === 'recipe-builder' && food.flags.includes('recipe-builder-complete');
}

export function foodComplete(food: FoodState) {
  const foodTypeChecks = {
    'free-text': () => false,
    'encoded-food': encodedFoodComplete,
    'missing-food': missingFoodComplete,
    'recipe-builder': recipeBuilderComplete,
  };

  return foodTypeChecks[food.type](food);
}

export function foodSearchComplete(food: FoodState) {
  return food.type !== 'free-text';
}

export function mealComplete(meal: MealState) {
  return !!meal.foods.length && meal.foods.every(foodComplete);
}

export function mealPortionSizeComplete(meal: MealState) {
  return !!meal.foods.length && meal.foods.every(foodPortionSizeComplete);
}

export function mealSearchComplete(meal: MealState) {
  return !!meal.foods.length && meal.foods.every(foodSearchComplete);
}

export function mealFreeEntryComplete(meal: MealState) {
  return meal.flags.includes('free-entry-complete');
}

export function surveyFreeEntryComplete(survey: SurveyState) {
  return (
    !!survey.meals.length
    && survey.meals.every(meal => mealFreeEntryComplete(meal))
  );
}

export function surveyPortionSizeComplete(survey: SurveyState) {
  return (
    !!survey.meals.length
    && survey.meals.every(meal => mealPortionSizeComplete(meal))
  );
}

export function surveySearchComplete(survey: SurveyState) {
  return (
    !!survey.meals.length
    && survey.meals.every(meal => mealSearchComplete(meal))
  );
}

export function surveyMealsComplete(survey: SurveyState) {
  return (
    !!survey.meals.length
    && survey.meals.every(meal => mealComplete(meal))
  );
}

export function getMealIndexForSelection(
  meals: MealState[],
  selection: Selection,
): number | undefined {
  const { element } = selection;

  if (element === null)
    return meals.length ? 0 : undefined;

  return element.type === 'meal'
    ? getMealIndexRequired(meals, element.mealId)
    : getFoodIndexRequired(meals, element.foodId).mealIndex;
}

export function flattenFoods(foods: FoodState[]): FoodState[] {
  const result = new Array<FoodState>();

  for (const food of foods) {
    result.push(food);
    if (food.linkedFoods.length > 0)
      result.push(...flattenFoods(food.linkedFoods));
  }

  return result;
}

export function customPromptComplete(store: SurveyStore, meal: MealState, food: FoodState, foodPrompts: Prompt[]): boolean {
  return filterForIncompleteCustomPrompts(store, meal, food, foodPrompts).length === 0;
}
