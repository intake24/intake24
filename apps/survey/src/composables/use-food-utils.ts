import type { EncodedFood, FoodState, RecipeBuilder } from '@intake24/common/surveys';

import { computed } from 'vue';

import { capitalize } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

export type UseFoodUtilsProps<
  F extends FoodState | undefined,
  FP extends EncodedFood | RecipeBuilder | undefined,
> = {
  food?: F;
  parentFood?: FP;
};

export function useFoodUtils<
  F extends FoodState | undefined,
  FP extends EncodedFood | RecipeBuilder | undefined,
>(props: UseFoodUtilsProps<F, FP> = {}) {
  const { translate } = useI18n();

  const getFoodName = (foodState: FoodState) => {
    if (foodState.type === 'encoded-food')
      return translate(foodState.data.localName);
    if (foodState.type === 'missing-food')
      return capitalize(foodState.info?.name ?? foodState.searchTerm ?? '??');
    if (foodState.type === 'recipe-builder')
      return capitalize(foodState.description);

    return capitalize(foodState.description);
  };

  const foodName = computed(
    () =>
      (props.food ? getFoodName(props.food) : undefined) as F extends undefined ? undefined : string,
  );
  const parentFoodName = computed(
    () =>
      (props.parentFood ? getFoodName(props.parentFood) : undefined) as FP extends undefined
        ? undefined
        : string,
  );

  return {
    foodName,
    getFoodName,
    parentFoodName,
  };
}
