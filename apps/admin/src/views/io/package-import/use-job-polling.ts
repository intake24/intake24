import type { JobAttributes } from '@intake24/common/types/http/admin';

import axios from 'axios';
import { onBeforeUnmount } from 'vue';

import { useHttp } from '@intake24/admin/services';

export class PollingStopped extends Error {
  constructor() {
    super('Job polling stopped');
    this.name = 'PollingStopped';
  }
}

export type JobPollingOptions = {
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  maxConsecutiveErrors?: number;
};

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new PollingStopped());
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(new PollingStopped());
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Polls one user job at a time until it completes. Starting a new poll, calling `stop()`
 * or unmounting the component stops the current poll, which then rejects with PollingStopped.
 */
export function useJobPolling(options: JobPollingOptions = {}) {
  const { initialDelay = 1000, maxDelay = 5000, backoffFactor = 1.5, maxConsecutiveErrors = 3 } = options;

  const http = useHttp();

  let controller: AbortController | null = null;

  async function poll(jobId: string): Promise<JobAttributes> {
    stop();

    const current = new AbortController();
    controller = current;

    let delay = initialDelay;
    let errors = 0;

    try {
      while (true) {
        await wait(delay, current.signal);

        try {
          const { data } = await http.get<JobAttributes>(`admin/user/jobs/${jobId}`, { signal: current.signal });
          if (data.completedAt)
            return data;

          errors = 0;
        }
        catch (err) {
          if (current.signal.aborted)
            throw new PollingStopped();

          // Asking again won't fix a client error; anything else gets a few more attempts
          const status = axios.isAxiosError(err) ? err.response?.status : undefined;
          if ((status && status < 500) || ++errors >= maxConsecutiveErrors)
            throw err;
        }

        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
    finally {
      if (controller === current)
        controller = null;
    }
  }

  function stop() {
    controller?.abort();
    controller = null;
  }

  onBeforeUnmount(stop);

  return { poll, stop };
}
