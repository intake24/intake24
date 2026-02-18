import type { ComputedRef, Ref, SetupContext } from 'vue';

import { ref, watch } from 'vue';

import { pushFullHistoryEntry } from '@intake24/survey/stores/recall-history';

export function usePromptHandlerNoStore<T>({ emit }: Pick<SetupContext<'action'[]>, 'emit'>, getInitialState: ComputedRef<T>, commitAnswer?: () => void) {
  const state = ref(getInitialState.value) as Ref<T>;

  watch(getInitialState, (initialState) => {
    state.value = initialState;
  });

  const action = (type: string, ...args: [id?: string, params?: object]) => {
    if (type === 'next' && commitAnswer) {
      pushFullHistoryEntry('no-store handler');
      commitAnswer();
    }

    emit('action', type, ...args);
  };

  return { state, action };
}
