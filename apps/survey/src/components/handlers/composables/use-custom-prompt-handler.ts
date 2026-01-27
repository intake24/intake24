import type { Prompt, Prompts } from '@intake24/common/prompts';
import type { CustomPromptAnswer, FoodState, MealState, PromptSection } from '@intake24/common/surveys';

import { useSurvey } from '@intake24/survey/stores';
import { useI18n } from '@intake24/ui';

import { useFoodPromptUtils } from './use-food-prompt-utils';
import { useMealPromptUtils } from './use-meal-prompt-utils';

const infoPrompts = ['info-prompt'];

export type UseCustomPromptHandlerProps<P extends keyof Prompts> = {
  prompt: Prompts[P];
  section: PromptSection;
};

export function useCustomPromptHandler<P extends keyof Prompts>(props: UseCustomPromptHandlerProps<P>) {
  const { i18n: { locale } } = useI18n();
  const { foodOptional } = useFoodPromptUtils();
  const { mealOptional } = useMealPromptUtils();
  const survey = useSurvey();

  const isAnswerRequired = (prompt: Prompt) =>
    !('validation' in prompt) || prompt.validation.required;
  const isInfoPrompt = (prompt: Prompt) => infoPrompts.includes(prompt.component);

  function getPromptAnswer(promptId: string, entity?: FoodState | MealState): CustomPromptAnswer | undefined {
    if (entity)
      return entity.customPromptAnswers[promptId];

    if (foodOptional.value && ['foods'].includes(props.section))
      return foodOptional.value.customPromptAnswers[promptId];

    if (mealOptional.value && ['preFoods', 'postFoods'].includes(props.section))
      return mealOptional.value.customPromptAnswers[promptId];

    return survey.data.customPromptAnswers[promptId];
  };

  function resolvePromptAnswer(prompt: Prompt, entity?: FoodState | MealState): CustomPromptAnswer | undefined {
    const answer = getPromptAnswer(prompt.id, entity);
    if (answer || !('options' in prompt))
      return answer;

    const values = (prompt.options[locale.value] ?? prompt.options.en).filter(o => o.selected).map(o => o.value);
    if (!values.length)
      return undefined;

    if ('multiple' in prompt)
      return prompt.multiple ? values : values.at(0);

    return ['checkbox-list-prompt'].includes(prompt.component) ? values : values.at(0);
  };

  function commitPromptAnswer(prompt: Prompt, promptAnswer?: CustomPromptAnswer) {
    const promptId = prompt.id;
    const isInfo = isInfoPrompt(prompt);

    if (promptAnswer === undefined && isAnswerRequired(props.prompt)) {
      console.warn('Did not expect answer to be undefined', props.prompt);
      return;
    }

    const answer = promptAnswer ?? null;
    const isValidAnswer = answer !== undefined && (!isInfo || answer !== 'next');

    if (survey.selection.element) {
      switch (survey.selection.element.type) {
        case 'food': {
          const food = foodOptional.value;
          if (!food) {
            console.warn('Expected meal to be defined');
            return;
          }

          if (isValidAnswer)
            survey.setFoodCustomPromptAnswer({ foodId: food.id, promptId, answer });

          if (isInfo)
            survey.addFoodFlag(food.id, `${promptId}-acknowledged`);

          break;
        }
        case 'meal': {
          const meal = mealOptional.value;
          if (!meal) {
            console.warn('Expected meal to be defined');
            return;
          }

          if (isValidAnswer)
            survey.setMealCustomPromptAnswer({ mealId: meal.id, promptId, answer });

          if (isInfo)
            survey.addMealFlag(meal.id, `${promptId}-acknowledged`);

          break;
        }
      }
    }
    else {
      if (isValidAnswer)
        survey.setCustomPromptAnswer({ promptId, answer });

      if (isInfo)
        survey.addFlag(`${promptId}-acknowledged`);
    }
  };

  return {
    commitPromptAnswer,
    resolvePromptAnswer,
    foodOptional,
    isAnswerRequired,
    mealOptional,
  };
}
