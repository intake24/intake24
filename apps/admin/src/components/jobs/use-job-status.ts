import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { useHttp } from '@intake24/admin/services';
import type { JobAttributes } from '@intake24/common/types/http/admin';

export function useJobStatus(jobId: string) {
  const http = useHttp();

  const status = ref<JobAttributes | null>(null);
  const polling = ref<number | null>(null);

  const complete = computed(() => status.value !== null && status.value.successful !== null);
  const progress = computed(() => status.value === null ? null : status.value.progress);
  const message = computed(() => status.value === null ? null : status.value.message);

  const getStatus = async () => {
    const response = await http.get(`admin/user/jobs/${jobId}`);
    status.value = response.data;
  };

  const startPolling = async (ms = 2000) => {
    await getStatus();

    if (polling.value !== null)
      return;

    // @ts-expect-error - node types
    polling.value = setInterval(async () => {
      await getStatus();
    }, ms);
  };

  const stopPolling = () => {
    if (polling.value !== null) {
      clearInterval(polling.value);
      polling.value = null;
    }
  };

  watch(complete, (val: boolean) => {
    if (val)
      stopPolling();
  });

  onBeforeUnmount(() => {
    stopPolling();
  });

  return {
    status,
    complete,
    progress,
    message,
    polling,
    getStatus,
    startPolling,
    stopPolling,
  };
}
