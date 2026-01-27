import type { Replace } from 'type-fest';

import type { LinkedParent } from '../../handlers/composables';
import type { HasMultiple, Prompt } from '@intake24/common/prompts';
import type { EncodedFood } from '@intake24/common/surveys';

import { computed } from 'vue';

import { usePortionSizeMethod } from './use-portion-size-method';

export type UseMultipleProps = {
  food: EncodedFood;
  linkedParent?: LinkedParent;
  prompt: Prompt & HasMultiple;
};

export function useMultiple<P extends 'as-served-prompt'>(props: UseMultipleProps) {
  const { parameters } = usePortionSizeMethod<Replace<P, '-prompt', ''>>(props);

  const multipleProps = computed(() => {
    if (typeof props.prompt.multiple === 'boolean')
      return undefined;

    const { type, ...rest } = props.prompt.multiple;

    return rest;
  });

  const multipleEnabled = computed(() => {
    if (props.linkedParent)
      return false;

    if (typeof props.prompt.multiple === 'boolean')
      return props.prompt.multiple;

    if (typeof props.prompt.multiple.strategy === 'boolean')
      return props.prompt.multiple.strategy;

    return !!parameters.value.multiple;
  });

  return { multipleProps, multipleEnabled };
}
