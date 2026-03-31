import type { SurveyStore } from '../stores';
import type { FoodState, Selection } from '@intake24/common/surveys';
import type PromptManager from '@intake24/survey/dynamic-recall/prompt-manager';

import { getFoodByIndex, getFoodIndexRequired, getMealIndexRequired } from '@intake24/survey/util';

function makeMealSelection(mealId: string): Selection {
  return {
    element: { type: 'meal', mealId },
    mode: 'auto',
  };
}

function makeFoodSelection(foodId: string): Selection {
  return {
    element: { type: 'food', foodId },
    mode: 'auto',
  };
}

export default class SelectionManager {
  private store;

  private promptManager;

  constructor(store: SurveyStore, promptManager: PromptManager) {
    this.store = store;
    this.promptManager = promptManager;
  }

  private mealPromptsAvailable(mealId: string, withSelection: Selection): boolean {
    return !!(
      this.promptManager.nextMealSectionPrompt('preFoods', mealId, withSelection)
      || this.promptManager.nextMealSectionPrompt('postFoods', mealId, withSelection)
    );
  }

  private selectMealIfPromptsAvailable(mealId: string): Selection | undefined {
    const selection = makeMealSelection(mealId);
    return this.mealPromptsAvailable(mealId, selection) ? selection : undefined;
  }

  private foodPromptsAvailable(foodId: string, forSelection: Selection): boolean {
    return this.promptManager.nextFoodsPrompt(foodId, forSelection) !== undefined;
  }

  private selectFoodIfPromptsAvailable(foodId: string): Selection | undefined {
    const selection = makeFoodSelection(foodId);
    return this.foodPromptsAvailable(foodId, selection) ? selection : undefined;
  }

  private selectNestedLinkedFood(foods: FoodState[]): Selection | undefined {
    for (const food of foods) {
      const nestedSelection = this.selectNestedLinkedFood(food.linkedFoods);
      if (nestedSelection !== undefined)
        return nestedSelection;

      const linkedSelection = makeFoodSelection(food.id);
      if (this.foodPromptsAvailable(food.id, linkedSelection))
        return linkedSelection;
    }
  }

  public tryAnyFoodInMeal(mealId: string): Selection | undefined {
    const meals = this.store.meals;
    const mealIndex = getMealIndexRequired(meals, mealId);
    const meal = meals[mealIndex];

    for (let foodIndex = 0; foodIndex < meal.foods.length; ++foodIndex) {
      const food = meal.foods[foodIndex];

      const linkedSelection = this.selectNestedLinkedFood(food.linkedFoods);
      if (linkedSelection !== undefined)
        return linkedSelection;

      const foodId = food.id;
      const selection = makeFoodSelection(foodId);
      if (this.foodPromptsAvailable(foodId, selection))
        return selection;
    }

    return undefined;
  }

  private tryAnyFoodInSubsequentMeals(mealId: string): Selection | undefined {
    const meals = this.store.meals;
    const mealIndex = getMealIndexRequired(meals, mealId);

    for (let i = mealIndex + 1; i < meals.length; ++i) {
      const selection = this.tryAnyFoodInMeal(meals[i].id);
      if (selection !== undefined)
        return selection;
    }
  }

  private tryAnyFoodInAnyMeal(): Selection | undefined {
    const meals = this.store.meals;

    for (let mealIndex = 0; mealIndex < meals.length; mealIndex++) {
      const selection = this.tryAnyFoodInMeal(meals[mealIndex].id);

      if (selection !== undefined)
        return selection;
    }
    return undefined;
  }

  private tryAnyMeal(): Selection | undefined {
    const meals = this.store.meals;

    for (let mealIndex = 0; mealIndex < meals.length; mealIndex++) {
      const mealId = meals[mealIndex].id;
      const selection = makeMealSelection(mealId);

      if (this.mealPromptsAvailable(mealId, selection))
        return selection;
    }
    return undefined;
  }

  private trySubsequentMeal(mealId: string): Selection | undefined {
    const meals = this.store.meals;
    const mealIndex = getMealIndexRequired(meals, mealId);

    for (let i = mealIndex + 1; i < meals.length; i++) {
      const mealId = meals[i].id;
      const selection = makeMealSelection(mealId);

      if (this.mealPromptsAvailable(mealId, selection))
        return selection;
    }
    return undefined;
  }

  firstAvailableSelection(): Selection {
    return this.tryAnyMeal() ?? this.tryAnyFoodInAnyMeal() ?? { mode: 'auto', element: null };
  }

  trySubsequentLinkedFood(foodId: string): Selection | undefined {
    const meals = this.store.meals;
    const foodIndex = getFoodIndexRequired(meals, foodId);
    const meal = meals[foodIndex.mealIndex];

    if (!foodIndex.linkedFoodIndex.length)
      return undefined;

    // Navigate to the parent linkedFoods array by traversing the index path
    let parentLinkedFoods = meal.foods[foodIndex.foodIndex].linkedFoods;
    for (const linkedIndex of foodIndex.linkedFoodIndex.slice(0, -1)) {
      parentLinkedFoods = parentLinkedFoods[linkedIndex].linkedFoods;
    }

    // Get the current index in the parent's linkedFoods array
    const currentIndex = foodIndex.linkedFoodIndex.at(-1)!;

    // Try subsequent linked foods at this nesting level
    for (let i = currentIndex + 1; i < parentLinkedFoods.length; ++i) {
      const nextLinkedFoodId = parentLinkedFoods[i].id;
      const selection = makeFoodSelection(nextLinkedFoodId);
      if (this.foodPromptsAvailable(nextLinkedFoodId, selection))
        return selection;
    }

    return undefined;
  }

  trySubsequentFoodInMeal(foodId: string): Selection | undefined {
    const meals = this.store.meals;
    const foodIndex = getFoodIndexRequired(meals, foodId);
    const meal = meals[foodIndex.mealIndex];

    const nextLinkedOrParentSelection
      = this.trySubsequentLinkedFood(foodId) ?? this.tryParentFood(foodId);

    if (nextLinkedOrParentSelection !== undefined)
      return nextLinkedOrParentSelection;

    for (let i = foodIndex.foodIndex + 1; i < meal.foods.length; ++i) {
      const nextFood = meal.foods[i];

      const linkedSelection = this.selectNestedLinkedFood(nextFood.linkedFoods);
      if (linkedSelection !== undefined)
        return linkedSelection;

      const nextFoodId = nextFood.id;
      const selection = makeFoodSelection(nextFoodId);
      if (this.foodPromptsAvailable(nextFoodId, selection))
        return selection;
    }

    return undefined;
  }

  tryParentFood(foodId: string): Selection | undefined {
    const meals = this.store.meals;
    const foodIndex = getFoodIndexRequired(meals, foodId);

    if (!foodIndex.linkedFoodIndex.length)
      return undefined;

    const parentFood = getFoodByIndex(meals, {
      ...foodIndex,
      linkedFoodIndex: foodIndex.linkedFoodIndex.slice(0, -1),
    });
    return this.selectFoodIfPromptsAvailable(parentFood.id);
  }

  nextSelection(): Selection {
    const selection = this.store.selection;

    if (selection.element === null) {
      return this.firstAvailableSelection();
    }
    else {
      switch (selection.element.type) {
        case 'meal': {
          const mealId = selection.element.mealId;

          return (
            this.tryAnyFoodInMeal(mealId)
            ?? this.trySubsequentMeal(mealId)
            ?? this.tryAnyFoodInSubsequentMeals(mealId)
            ?? this.firstAvailableSelection()
          );
        }

        case 'food': {
          const foodId = selection.element.foodId;
          const mealId
            = this.store.meals[getFoodIndexRequired(this.store.meals, foodId).mealIndex].id;

          return (
            this.trySubsequentFoodInMeal(foodId)
            ?? this.tryAnyFoodInMeal(mealId)
            ?? this.selectMealIfPromptsAvailable(mealId)
            ?? this.trySubsequentMeal(mealId)
            ?? this.tryAnyFoodInSubsequentMeals(mealId)
            ?? this.firstAvailableSelection()
          );
        }
      }
    }
  }
}
