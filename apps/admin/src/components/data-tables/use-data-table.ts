import type { ComputedRef, Ref } from 'vue';

import type { Dictionary } from '@intake24/common/types';
import type { Pagination, PaginationMeta } from '@intake24/common/types/http';

import { computed, ref, watch } from 'vue';

import { useHttp } from '@intake24/admin/services';
import { useResource } from '@intake24/admin/stores';

export type DataTableOptions = {
  itemsPerPage: number;
  page: number;
  sortBy: { key: string; order: string }[];
  groupBy: { key: string; order: string }[];
};

export type DataTableHeader = {
  key: string;
  title: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
};

export type DataTableProps = {
  apiUrl?: string;
  headers: DataTableHeader[];
  trackBy: string;
};

export function useDataTable(props: DataTableProps, filter: ComputedRef<Dictionary> | Ref<Dictionary>) {
  const http = useHttp();
  const resource = useResource();

  const api = computed(() => props.apiUrl ?? resource.api);

  const items = ref<Dictionary[]>([]);
  const meta = ref<Partial<PaginationMeta>>({ total: 0 });
  const options = ref<DataTableOptions>({} as DataTableOptions);
  const selected = ref<Dictionary[]>([]);

  const tracked = computed<string[] | number[]>(() =>
    selected.value.map(item => item[props.trackBy]),
  );

  const fetch = async () => {
    const {
      page,
      itemsPerPage: limit,
      sortBy: [sortItem],
    } = options.value;

    const sort = sortItem ? `${sortItem.key}|${sortItem.order}` : undefined;

    const { data } = await http.get<Pagination>(api.value, {
      params: { limit, page, sort, ...filter.value },
      withLoading: true,
    });

    items.value = [...data.data];
    meta.value = { ...data.meta };
  };

  watch(options, async () => {
    await fetch();
  });

  watch(api, async () => {
    items.value = [];
    meta.value = { total: 0 };
  });

  return { api, fetch, items, meta, options, selected, tracked };
}
