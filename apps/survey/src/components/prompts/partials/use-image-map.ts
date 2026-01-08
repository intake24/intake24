import type { Ref } from 'vue';
import { chunk } from 'lodash-es';
import { computed, ref } from 'vue';

import type { ImageMapResponse } from '@intake24/common/types/http';

export type UseImageMapProps = {
  imageMapData: ImageMapResponse;
  index?: number;
  labels: { image: string; objects: string[] };
};

export function useImageMap(props: UseImageMapProps, width: Ref<number>) {
  const hoverIndex = ref<number | undefined>(undefined);

  const objects = computed(() =>
    props.imageMapData.objects.map(object => ({
      id: object.id,
      polygon: chunk(
        object.outlineCoordinates.map(coord => coord * width.value),
        2,
      )
        .map(node => node.join(','))
        .join(' '),
    })),
  );

  const label = computed(() => {
    if (!props.labels.objects.length || (hoverIndex.value === undefined && props.index === undefined))
      return undefined;

    const idx = hoverIndex.value ?? props.index;
    return idx === undefined ? undefined : props.labels.objects[idx];
  });

  return {
    hoverIndex,
    label,
    objects,
  };
}
