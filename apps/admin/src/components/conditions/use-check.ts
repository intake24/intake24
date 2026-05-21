import type { SetupContext } from 'vue';

import { useVModel } from '@vueuse/core';

import { useSelects } from '@intake24/admin/composables';

export type UseCheckProps<T> = {
  modelValue: T;
};

export function useCheck<T>(props: UseCheckProps<T>, { emit }: Pick<SetupContext<'update:modelValue'[]>, 'emit'>) {
  const comboOps = ['setEq', 'in', 'notIn'];
  const { conditionOps } = useSelects();

  const currentValue = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

  return {
    comboOps,
    conditionOps,
    currentValue,
  };
}
