import type { StyleValue } from 'vue';

import { computed, onUpdated, shallowRef } from 'vue';

export function useOffset() {
  const listItemViewOffset = shallowRef<number>(0);
  const listItemStyle = computed<StyleValue>(() => {
    return {
      minHeight: '192px',
      height: `calc(100vh - ${listItemViewOffset.value}px)`,
      overflowY: 'auto',
    };
  });

  onUpdated(() => {
  // retrieve height of following elements to offset
    listItemViewOffset.value = (document.getElementById('header')?.offsetHeight || 0)
      + (document.getElementById('footer')?.offsetHeight || 0)
      + (document.getElementById('entryBreadcrumb')?.offsetHeight || 0)
      + (document.getElementById('entryTabs')?.offsetHeight || 0);
  });

  return {
    listItemStyle,
  };
}
