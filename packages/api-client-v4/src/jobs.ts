import type { BaseClientV4 } from './base-client-v4';
import type { JobEntry } from '@intake24/common/types/http/admin';

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class JobsApiV4 {
  private static readonly apiPath = '/api/admin/jobs';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  public async get(jobId: string): Promise<JobEntry | null> {
    return this.baseClient.getOptional<JobEntry>(`${JobsApiV4.apiPath}/${jobId}}`);
  }

  public async await(jobId: string, timeoutMs: number): Promise<JobEntry> {
    const startTime = Date.now();

    for (;;) {
      if (Date.now() - startTime > timeoutMs)
        throw new Error(`Timed out while waiting for job ${jobId} to complete`);

      const status = await this.get(jobId);

      if (status === null)
        throw new Error(`Job ${jobId} not found`);

      if (status.successful !== null) {
        if (status.successful)
          return status;
        else throw new Error(`Job ${jobId} failed: ${status.message}`);
      }
      else {
        await delay(100);
      }
    }
  }
}
