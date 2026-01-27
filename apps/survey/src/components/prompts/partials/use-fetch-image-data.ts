import type { MaybeRef } from 'vue';

import { onMounted, ref, toRef, watch } from 'vue';

import { useHttp } from '@intake24/ui';

export type UseFetchImageDataProps<D> = {
  url: MaybeRef<string | undefined>;
  onFetch?: (data: D) => void;
};

export function useFetchImageData<D>(props: UseFetchImageDataProps<D>) {
  const http = useHttp();

  const url = toRef(props.url);
  const imageData = ref<D | null>(null);

  async function fetchImageData() {
    if (!url.value)
      return;

    const { data } = await http.get<D>(url.value);

    imageData.value = { ...data };

    props.onFetch?.(data);
  };

  watch(url, async () => {
    await fetchImageData();
  });

  onMounted(async () => {
    await fetchImageData();
  });

  return {
    imageData,
    fetchImageData,
  };
}
