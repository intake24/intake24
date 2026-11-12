import type { PropType, SetupContext } from 'vue';

import type { ReturnUseErrors } from '@intake24/admin/composables/use-errors';
import type { JobParams } from '@intake24/common/types';

import { useVModel } from '@vueuse/core';

type WithFormFile<P> = {
  [K in keyof P]: K extends 'file' ? File | null : P[K];
};

export type JobParamsForm<T extends keyof JobParams> = WithFormFile<JobParams[T]>;

export function createJobParamProps<T extends keyof JobParams>() {
  return {
    errors: {
      type: Object as PropType<ReturnUseErrors>,
      required: true,
    },
    modelValue: {
      type: Object as PropType<JobParamsForm<T>>,
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
  modelValue: JobParamsForm<T>;
  disabled?: Record<keyof JobParams[T], boolean>;
};

export function useJobParams<T extends keyof JobParams>(props: UseJobParamsProps<T>, { emit }: Pick<SetupContext<'update:modelValue'[]>, 'emit'>) {
  const params = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

  return {
    params,
  };
}
