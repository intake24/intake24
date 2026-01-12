import type { SetupContext } from 'vue';
import type { MenuItem } from './use-food-item';

import { computed } from 'vue';
import type { FoodActionType, MealActionType } from '@intake24/common/prompts';
import type { MealState } from '@intake24/common/surveys';
import { useMealUtils } from '@intake24/survey/composables';

import { useI18n } from '@intake24/ui';

export type UseMealItemProps = {
  meal: MealState;
  selectedFoodId?: string;
  selectedFoodInMeal: boolean;
  selectedMealId?: string;
};

export function useMealItem(props: UseMealItemProps, { emit }: Pick<SetupContext<'action'[]>, 'emit'>) {
  const { i18n: { t } } = useI18n();
  const { mealName, mealTime } = useMealUtils(props);

  const isSelected = computed(() => props.selectedMealId === props.meal.id);

  const menu = computed(() =>
    (
      [
        {
          name: t('recall.menu.meal.editFoods'),
          action: 'editMeal',
          icon: '$meal',
          if: (meal: MealState) => meal.flags.includes('free-entry-complete'),
        },
        {
          name: t('recall.menu.meal.editTime'),
          action: 'mealTime',
          icon: '$mealTime',
          if: (meal: MealState) => !meal.flags.includes('meal-time:disabled'),
        },
        {
          name: t('recall.menu.meal.delete'),
          action: 'deleteMeal',
          dialog: true,
          icon: '$delete',
        },
      ] satisfies MenuItem[]
    ).filter(item => !item.if || item.if(props.meal)),
  );

  const action = (type: FoodActionType | MealActionType, id?: string) => {
    emit('action', type, id);
  };

  return { action, isSelected, menu, mealName, mealTime };
}
