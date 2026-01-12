import { computed } from 'vue';
import type { MealState } from '@intake24/common/surveys';
import { fromTime } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

export type UseMealUtilsProps = {
  meal?: MealState;
};

export function useMealUtils(props: UseMealUtilsProps = {}) {
  const { translate } = useI18n();

  const getMealName = (mealState: MealState) => translate(mealState.name);

  const mealName = computed(() => (props.meal ? getMealName(props.meal) : undefined));

  const getMealTime = (mealState?: MealState) =>
    mealState?.time ? fromTime(mealState.time) : undefined;

  const mealTime = computed(() => getMealTime(props.meal));

  const getMealNameWithTime = (mealState: MealState) => {
    const mealName = getMealName(mealState);
    const mealTime = getMealTime(mealState);

    return mealName && mealTime ? `${mealName} (${mealTime})` : mealName;
  };

  const mealNameWithTime = computed(() =>
    mealName.value && mealTime.value ? `${mealName.value} (${mealTime.value})` : mealName.value,
  );

  return {
    getMealName,
    getMealNameWithTime,
    getMealTime,
    mealName,
    mealNameWithTime,
    mealTime,
  };
}
