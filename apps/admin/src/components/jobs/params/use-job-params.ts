import type { PropType, SetupContext } from 'vue';

import type { ReturnUseErrors } from '@intake24/admin/composables/use-errors';
import type { JobParams } from '@intake24/common/types';

import { useVModel } from '@vueuse/core';

export function createJobParamProps<T extends keyof JobParams>() {
  return {
    errors: {
      type: Object as PropType<ReturnUseErrors>,
      required: true,
    },
    modelValue: {
      type: Object as PropType<JobParams[T]>,
      required: true,
    },
    disabled: {
      type: Object as PropType<Record<keyof JobParams[T], boolean>>,
      default: () => ({}),
    },
  } as const;
}

export type UseJobParamsProps<T extends keyof JobParams> = {
  errors: ReturnUseErrors;
  modelValue: JobParams[T];
  disabled?: Record<keyof JobParams[T], boolean>;
};

export function useJobParams<T extends keyof JobParams>(props: UseJobParamsProps<T>, { emit }: Pick<SetupContext<'update:modelValue'[]>, 'emit'>) {
  const params = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

  return {
    params,
  };
}
