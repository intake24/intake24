import type { EncodedFood, PortionSizeMethodId, PortionSizeParameters } from '@intake24/common/surveys';

import { computed } from 'vue';

export type UsePortionSizeProps = {
  food: EncodedFood;
};

export function usePortionSizeMethod<T extends PortionSizeMethodId>(props: UsePortionSizeProps) {
  const psmValid = computed(() => props.food.portionSizeMethodIndex !== null);

  const portionSize = computed(() => {
    if (props.food.portionSizeMethodIndex === null)
      throw new Error('This prompt requires a portion size option to be selected');

    return props.food.data.portionSizeMethods[props.food.portionSizeMethodIndex];
  });

  const conversionFactor = computed(() => portionSize.value.conversionFactor);
  const parameters = computed(() => portionSize.value.parameters as PortionSizeParameters[T]);

  return { conversionFactor, parameters, psmValid };
}
