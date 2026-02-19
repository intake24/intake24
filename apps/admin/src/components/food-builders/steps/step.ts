import type { PropType } from 'vue';

import type { ReturnUseErrors } from '@intake24/admin/composables';
import type { FoodBuilderStepType, GetFoodBuilderStep } from '@intake24/common/types/http/admin';

export function createStepProps<P extends FoodBuilderStepType>() {
  return {
    errors: {
      type: Object as PropType<ReturnUseErrors>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    localeId: {
      type: String,
      required: true,
    },
    modelValue: {
      type: Object as PropType<GetFoodBuilderStep<P>>,
      required: true,
    },
    stepIndex: {
      type: Number,
      required: true,
    },
  } as const;
};
