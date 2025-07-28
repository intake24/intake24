import type { SetupContext } from 'vue';
import { computed } from 'vue';

import type { FoodActionType, MealActionType } from '@intake24/common/prompts';
import type { FoodState, MealState } from '@intake24/common/surveys';
import { useI18n } from '@intake24/i18n';
import { useFoodUtils } from '@intake24/survey/composables';
import { useSurvey } from '@intake24/survey/stores';
import { customPromptComplete, foodComplete, foodPortionSizeComplete } from '@intake24/survey/util';

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
  const { i18n: { t } } = useI18n();
  const { foodName } = useFoodUtils(props);
  const survey = useSurvey();

  const isPortionSizeComplete = computed(() => foodPortionSizeComplete(props.food));

  const isCustomPromptComplete = computed(() => {
    return customPromptComplete(survey, props.meal, props.food, survey.foodPrompts);
  });

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

  return { action, foodName, isPortionSizeComplete, isCustomPromptComplete, menu };
}
