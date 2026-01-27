import type { Dictionary } from '@intake24/common/types';

import { computed, toRefs } from 'vue';

import { useEntry as useStoreEntry, useUser } from '@intake24/admin/stores';

export type UseStoreEntryProps = {
  id: string;
};

export function useEntry<T = Dictionary, R = Dictionary>(props: UseStoreEntryProps) {
  const { id } = toRefs(props);
  const entryStore = useStoreEntry();

  const entry = computed(() => entryStore.data as T);
  const entryLoaded = computed(() => entryStore.dataLoaded);

  const refs = computed(() => entryStore.refs as R);
  const refsLoaded = computed(() => entryStore.refsLoaded);

  const isCreate = computed(() => id.value === 'create');
  const isEdit = computed(() => !isCreate.value);

  const canHandleEntry = (action: string) => {
    if (isCreate.value)
      return false;

    const { securables, ownerId } = entryStore.data;

    return useUser().can({ action, securables, ownerId });
  };

  return {
    entry,
    entryLoaded,
    isCreate,
    isEdit,
    refs,
    refsLoaded,
    canHandleEntry,
  };
}
