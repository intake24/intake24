import { DetailedError, Upload } from 'tus-js-client';
import { computed, onBeforeUnmount, ref } from 'vue';

import { useHttp } from '@intake24/admin/services';

import { AxiosHttpStack } from './axios-http-stack';

const CHUNK_SIZE = 5 * 1024 * 1024;
const RETRY_DELAYS = [0, 1000, 3000, 5000];

// Transfer rate is sampled at most this often and smoothed, so the time estimate doesn't jump around
const RATE_SAMPLE_MS = 500;
const RATE_SMOOTHING = 0.3;

export type UploadFailureReason = 'cancelled' | 'permission' | 'tooLarge' | 'storage' | 'unexpected';

export class UploadFailure extends Error {
  constructor(readonly reason: UploadFailureReason, message: string = reason) {
    super(message);
    this.name = 'UploadFailure';
  }
}

function toUploadFailure(err: Error | DetailedError) {
  const status = err instanceof DetailedError ? err.originalResponse?.getStatus() : undefined;

  switch (status) {
    case 403:
      return new UploadFailure('permission', err.message);
    case 413:
      return new UploadFailure('tooLarge', err.message);
    case 507:
      return new UploadFailure('storage', err.message);
    default:
      return new UploadFailure('unexpected', err.message);
  }
}

// Same as tus' default rule (retry network errors, 409, 423 and 5xx), except that
// low disk space (507) won't clear up within a few seconds either
function shouldRetry(err: DetailedError) {
  const status = err.originalResponse?.getStatus() ?? 0;
  if (!status)
    return true;

  return status === 409 || status === 423 || (status >= 500 && status !== 507);
}

export function useTusUpload() {
  const http = useHttp();

  const bytesUploaded = ref(0);
  const bytesTotal = ref(0);
  const bytesPerSecond = ref<number | null>(null);

  const percent = computed(() => bytesTotal.value ? Math.floor((bytesUploaded.value / bytesTotal.value) * 100) : 0);
  const secondsRemaining = computed(() => bytesPerSecond.value
    ? Math.max(0, (bytesTotal.value - bytesUploaded.value) / bytesPerSecond.value)
    : null);

  let active: { upload: Upload; reject: (failure: UploadFailure) => void } | null = null;

  /**
   * Uploads the file and resolves with its file ID (last segment of the upload URL).
   * Rejects with an UploadFailure, including when aborted.
   */
  function start(file: File): Promise<string> {
    abort();

    bytesUploaded.value = 0;
    bytesTotal.value = file.size;
    bytesPerSecond.value = null;

    let sampleTime = performance.now();
    let sampleBytes = 0;

    return new Promise<string>((resolve, reject) => {
      const upload: Upload = new Upload(file, {
        endpoint: '/admin/large-file-upload',
        chunkSize: CHUNK_SIZE,
        retryDelays: RETRY_DELAYS,
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        httpStack: new AxiosHttpStack(http.axios),
        // Resuming previous uploads isn't offered, so don't leave fingerprints in local storage
        storeFingerprintForResuming: false,
        onShouldRetry: shouldRetry,
        onProgress: (sent, total) => {
          if (active?.upload !== upload)
            return;

          bytesUploaded.value = sent;
          bytesTotal.value = total;

          const now = performance.now();
          const elapsed = now - sampleTime;
          if (elapsed < RATE_SAMPLE_MS)
            return;

          const rate = ((sent - sampleBytes) / elapsed) * 1000;
          sampleTime = now;
          sampleBytes = sent;

          // A retried chunk moves the byte count backwards
          if (rate < 0)
            return;

          bytesPerSecond.value = bytesPerSecond.value === null
            ? rate
            : RATE_SMOOTHING * rate + (1 - RATE_SMOOTHING) * bytesPerSecond.value;
        },
        onSuccess: () => {
          if (active?.upload !== upload)
            return;

          active = null;

          const fileId = upload.url?.split('/').at(-1);
          if (fileId)
            resolve(fileId);
          else
            reject(new UploadFailure('unexpected', 'Upload URL is missing'));
        },
        onError: (err) => {
          if (active?.upload !== upload)
            return;

          active = null;
          reject(toUploadFailure(err));
        },
      });

      active = { upload, reject };
      upload.start();
    });
  }

  /** Stops the upload in progress (if any) and deletes what was uploaded so far on the server */
  function abort() {
    if (!active)
      return;

    const { upload, reject } = active;
    active = null;

    upload.abort(true).catch((err) => {
      // Best effort: the server cleans up stale uploads anyway
      console.warn('Failed to terminate upload', err);
    });
    reject(new UploadFailure('cancelled'));
  }

  onBeforeUnmount(abort);

  return {
    bytesUploaded,
    bytesTotal,
    bytesPerSecond,
    percent,
    secondsRemaining,
    start,
    abort,
  };
}
