import type { SetupContext } from 'vue';
import { computed } from 'vue';

import type { FoodActionType, MealActionType } from '@intake24/common/prompts';
import type { FoodState, MealState } from '@intake24/common/surveys';
import { useFoodUtils } from '@intake24/survey/composables';
import { useSurvey } from '@intake24/survey/stores';
import { customPromptComplete, foodComplete, foodPortionSizeComplete } from '@intake24/survey/util';
import { useI18n } from '@intake24/ui';

export type MenuItem = {
  name: string;
  action: FoodActionType | MealActionType;
  dialog?: boolean;
  icon?: string;
  if?: (item: any) => boolean;
};

export type UseFoodItemProps = {
  food: FoodState;
  meal: MealState;
};

export function useFoodItem(props: UseFoodItemProps, { emit }: Pick<SetupContext<'action'[]>, 'emit'>) {
  const { i18n: { t, locale } } = useI18n();
  const { foodName } = useFoodUtils(props);
  const survey = useSurvey();

  const isPortionSizeComplete = computed(() => foodPortionSizeComplete(props.food));

  const isCustomPromptComplete = computed(() => customPromptComplete(survey, props.meal, props.food, survey.foodPrompts));

  const menu = computed(() =>
    (
      [
        {
          name: t('recall.menu.food.change'),
          action: 'changeFood',
          icon: '$meal',
        },
        {
          name: t(`recall.menu.food.${props.food.type}.edit`),
          action: 'editFood',
          icon: '$food',
          if: (food: FoodState) => foodComplete(food),
        },
        {
          name: t('recall.menu.food.delete'),
          action: 'deleteFood',
          dialog: true,
          icon: '$delete',
        },
      ] satisfies MenuItem[]
    ).filter(item => !item.if || item.if(props.food)),
  );

  const action = (type: FoodActionType | MealActionType, id?: string) => {
    emit('action', type, id);
  };

  const customPromptAnswerLabels = computed(() => {
    if (!props.food.customPromptAnswers || Object.keys(props.food.customPromptAnswers).length === 0) {
      return '';
    }
    const foodPrompts = survey.foodPrompts;
    const answers = Object.entries(props.food.customPromptAnswers).reduce<string[]>((acc, [promptId, answer]) => {
      const prompt = foodPrompts.find(p => p.id === promptId);
      let displayText = '';
      if (prompt && 'options' in prompt && prompt.options) {
        const options = prompt.options[locale.value] || prompt.options.en || [];
        if (Array.isArray(answer)) { // Multiple selection
          const labels = answer.map((value) => {
            const option = options.find(opt => opt.value === value);
            return option?.shortLabel ?? option?.label ?? (value || '').toString();
          });
          displayText = labels.join(', ');
        }
        else { // Single selection
          const option = options.find(opt => opt.value === answer);
          displayText = option?.shortLabel ?? option?.label ?? (answer || '').toString();
        }
      }
      if (displayText.trim())
        acc.push(displayText);
      return acc;
    }, []);
    return answers.join(', ');
  });

  return { action, foodName, isPortionSizeComplete, isCustomPromptComplete, menu, customPromptAnswerLabels };
}
