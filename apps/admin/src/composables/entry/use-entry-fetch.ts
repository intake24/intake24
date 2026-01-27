import type { UseStoreEntryProps } from './use-entry';

import { onBeforeRouteLeave } from 'vue-router';

import resources from '@intake24/admin/router/resources';
import { useEntry } from '@intake24/admin/stores';

export function useEntryFetch(props: UseStoreEntryProps) {
  const { requestEntry } = useEntry();

  const fetch = async (id?: string, module?: string) => {
    const api = module ? resources.find(({ name }) => name === module)?.api : undefined;

    await requestEntry({ id: id ?? props.id, api });
  };

  fetch();

  onBeforeRouteLeave(async (to, from, next) => {
    if (from.params.id === to.params.id) {
      const fromModule = from.meta?.module.parent ?? from.meta?.module.current;
      const toModule = to.meta?.module.parent ?? to.meta?.module.current;
      if (fromModule === toModule) {
        next();
        return;
      }
    }

    if (typeof to.params.id === 'string')
      await fetch(to.params.id, to.meta?.module.parent ?? to.meta?.module.current);

    next();
  });

  return { fetch };
}
