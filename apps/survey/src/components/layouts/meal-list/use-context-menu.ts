import type { SetupContext } from 'vue';

import type { FoodActionType, MealActionType } from '@intake24/common/prompts';
import type { FoodState, MealState } from '@intake24/common/surveys';

import { computed, ref } from 'vue';

import { mealActionTypes } from '@intake24/common/prompts';
import { useFoodUtils, useMealUtils } from '@intake24/survey/composables';

export type UseContextMenuProps = {
  food?: FoodState;
  meal: MealState;
};

export function useContextMenu(props: UseContextMenuProps, { emit }: Pick<SetupContext<'action'[]>, 'emit'>) {
  const { foodName } = useFoodUtils(props);
  const { mealName } = useMealUtils(props);

  const dialog = ref(false);

  const isFood = computed(() => !!(props.meal && props.food));
  const isMeal = computed(() => props.meal && !props.food);
  const entity = computed(() => (isFood.value && props.food ? props.food : props.meal));
  const entityName = computed(() => (isFood.value ? foodName.value : mealName.value));

  const action = (type: FoodActionType | MealActionType) => {
    emit('action', type, mealActionTypes.includes(type as any) ? props.meal.id : props.food?.id);
  };

  const openDialog = (type: FoodActionType | MealActionType) => {
    if (!['deleteFood', 'deleteMeal'].includes(type))
      return;

    dialog.value = true;
  };

  return {
    dialog,
    action,
    openDialog,
    isFood,
    isMeal,
    entity,
    entityName,
  };
}
