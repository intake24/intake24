import type { ComputedRef, Ref, SetupContext } from 'vue';

import { ref, watch } from 'vue';

export function usePromptHandlerNoStore<T>({ emit }: Pick<SetupContext<'action'[]>, 'emit'>, getInitialState: ComputedRef<T>, commitAnswer?: () => void) {
  const state = ref(getInitialState.value) as Ref<T>;

  watch(getInitialState, (initialState) => {
    state.value = initialState;
  });

  const action = (type: string, ...args: [id?: string, params?: object]) => {
    if (type === 'next' && commitAnswer)
      commitAnswer();

    emit('action', type, ...args);
  };

  return { state, action };
}
