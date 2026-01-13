import type { ComputedRef } from 'vue';

import type { JobType } from '@intake24/common/types';
import type { JobAttributes } from '@intake24/common/types/http/admin';

import { computed, onBeforeUnmount, ref, toValue, watch } from 'vue';

import { useHttp } from '@intake24/admin/services';

export interface PollsForJobsOptions {
  limit?: number;
  startedAfter?: ComputedRef<string> | string;
}

export function usePollsForJobs(
  jobType: JobType | readonly JobType[],
  query?: ComputedRef<Record<string, string | number>>,
  options?: PollsForJobsOptions,
) {
  const http = useHttp();

  const dialog = ref<boolean>(false);
  const jobs = ref<JobAttributes[]>([]);
  const polling = ref<number | null>(null);

  const jobInProgress = computed(() =>
    jobs.value.some(item => item.progress !== 1 && item.completedAt === null),
  );

  const status = async () => {
    const {
      data: { data },
    } = await http.get(`admin/user/jobs`, {
      params: {
        type: jobType,
        limit: options?.limit ?? 5,
        startedAfter: options?.startedAfter ? toValue(options.startedAfter) : undefined,
        ...(query ? query.value : {}),
      },
    });

    jobs.value = [...data];
  };

  const startPolling = async (now = false, ms = 2000) => {
    if (now)
      await status();

    if (polling.value !== null)
      return;

    // @ts-expect-error - node types
    polling.value = setInterval(async () => {
      await status();
    }, ms);
  };

  const stopPolling = () => {
    if (polling.value !== null) {
      clearInterval(polling.value);
      polling.value = null;
    }
  };

  watch(jobs, (val: JobAttributes[]) => {
    if (!val.length || !jobInProgress.value)
      stopPolling();
  });

  watch(dialog, async (val: boolean) => {
    if (!val) {
      stopPolling();
      return;
    }

    await status();
  });

  onBeforeUnmount(() => {
    stopPolling();
  });

  return {
    dialog,
    jobs,
    polling,
    jobInProgress,
    status,
    startPolling,
    stopPolling,
  };
}
