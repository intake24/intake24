import type { ShallowRef } from 'vue';
import type Chart from 'vue-echarts';

import { onBeforeUnmount, onMounted } from 'vue';

export function usePrintCharts(charts: Readonly<ShallowRef<InstanceType<typeof Chart>[] | null>>) {
  // autoresize does not fire for the print layout, and the SVG has no viewBox to scale by, so redraw at the print size.
  // Chrome snapshots the page right after this handler: the redraw must not animate, and flush paints now instead of on the next frame.
  const printMedia = matchMedia('print');

  function resize() {
    for (const chart of charts.value ?? []) {
      chart.resize({
        animation: { duration: 0 },
      });
      chart.getZr().flush();
    }
  }

  onMounted(() => printMedia.addEventListener('change', resize));
  onBeforeUnmount(() => printMedia.removeEventListener('change', resize));
}
