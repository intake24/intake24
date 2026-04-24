import type { ComputedRef, Ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';

import type { RouteLeave } from '@intake24/admin/types';

import { computed, ref } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

import { copy } from '@intake24/common/util';

export function useEntryWatch(originalEntry: Ref<object>, changed?: ComputedRef<boolean>) {
  const routeLeave = ref<RouteLeave>({
    dialog: false,
    to: null,
    confirmed: false,
  });

  const entryChanged = changed ?? computed(() => true);

  const setOriginalEntry = (data: object) => {
    originalEntry.value = copy(data);
  };

  const beforeRouteCheck = (to: RouteLocationNormalized) => {
    if (routeLeave.value.confirmed) {
      routeLeave.value = { dialog: false, to: null, confirmed: false };
      return true;
    }

    if (entryChanged.value) {
      routeLeave.value = { dialog: true, to, confirmed: false };
      return false;
    }
  };

  onBeforeRouteUpdate((to) => {
    return beforeRouteCheck(to);
  });

  onBeforeRouteLeave((to) => {
    return beforeRouteCheck(to);
  });

  return { originalEntry, routeLeave, entryChanged, setOriginalEntry };
}
