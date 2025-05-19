import type { AddonFood, Prompt, Prompts } from '@intake24/common/prompts';
import type { FoodState, MealState } from '@intake24/common/surveys';
import { checkPromptCustomConditions, evaluateCondition } from '@intake24/survey/dynamic-recall/prompt-manager';
import type { SurveyStore } from '@intake24/survey/stores';
import { flattenFoods } from '@intake24/survey/util/meal-food';

export function filterMealsForAggregateChoicePrompt(surveyStore: SurveyStore, prompt: Prompts['aggregate-choice-prompt']): MealState[] {
  return surveyStore.data.meals.map(meal => ({
    ...meal,
    foods: flattenFoods(meal.foods).filter((food) => {
      if (food.type !== 'encoded-food')
        return false;
      if (prompt.foodFilter !== undefined)
        return evaluateCondition(prompt.foodFilter, surveyStore, meal, food, `aggregate food choice filter (${prompt.id})`);
      else
        return true;
    }),
  })).filter(meal => meal.foods.length > 0);
}

export function filterFoodsForFoodSelectionPrompt(surveyStore: SurveyStore, meal: MealState, prompt: Prompts['food-selection-prompt']): FoodState[] {
  return meal.foods.filter(food =>
    prompt.foodFilter
      ? evaluateCondition(prompt.foodFilter, surveyStore, meal, food, `food selection filter (${prompt.id})`)
      : true,
  );
}

export type AddonFoods = Record<string, Record<string, AddonFood[]>>;

export function filterForAddonFoods(surveyStore: SurveyStore, prompt: Prompts['addon-foods-prompt'], meal?: MealState): AddonFoods {
  const meals = meal ? [meal] : surveyStore.data.meals;

  return meals.reduce<AddonFoods>((acc, meal) => {
    if (!acc[meal.id])
      acc[meal.id] = {};

    return flattenFoods(meal.foods).reduce<AddonFoods>((acc, food) => {
      if (!acc[meal.id][food.id])
        acc[meal.id][food.id] = [];

      for (const addon of prompt.addons) {
        if (food.flags.includes(`${prompt.id}-complete`))
          continue;

        if (addon.filter.every(condition => evaluateCondition(condition, surveyStore, meal, food, `addon food filter (${prompt.id})`)))
          acc[meal.id][food.id].push(addon);
      }
      return acc;
    }, acc);
  }, {});
}

export function filterForIncompleteCustomPrompts(store: SurveyStore, meal: MealState, food: FoodState, foodPrompts: Prompt[]): Prompt[] {
  return foodPrompts.filter((prompt) => {
    if (prompt.type !== 'custom' || prompt.component === 'no-more-information-prompt') {
      return false;
    }
    if (!checkPromptCustomConditions(store, meal, food, prompt)) {
      return false;
    }
    const answer = food.customPromptAnswers[prompt.id];
    return (
      answer === undefined
      || (typeof answer === 'object' && answer !== null && Object.keys(answer).length === 0)
    );
  });
}
