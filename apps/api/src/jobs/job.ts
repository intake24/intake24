import type { Job as BullJob } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { JobData, JobParams, JobType } from '@intake24/common/types';

export type JobProgress = { done: number; all: number };

export default abstract class Job<T extends JobType, R = any> {
  abstract readonly name: T;

  protected id!: string;

  protected dbId!: string;

  protected job!: BullJob;

  protected params!: JobParams[T];

  protected isRepeatable!: boolean;

  protected logger;

  private progress: JobProgress = { done: 0, all: 0 };

  constructor({ logger }: Pick<IoC, 'logger'>) {
    this.logger = logger;
  }

  protected init(job: BullJob<JobData<T>>): void {
    const {
      id,
      data: { params },
    } = job;

    this.logger = this.logger.child({ service: this.name, id, params });

    if (!id)
      throw new Error('Job ID missing.');

    this.id = id;
    this.dbId = id.replace('db-', '');
    this.job = job;
    this.params = params;
    this.isRepeatable = id.startsWith('repeat:');
  }

  /**
   * To be implemented by each job
   *
   * @abstract
   * @param {BullJob<JobData<T>>} job
   * @returns {Promise<R>}
   * @memberof Job
   */
  abstract run(job: BullJob<JobData<T>>): Promise<R>;

  /**
   * Get current progress
   *
   * @protected
   * @returns {number}
   * @memberof Job
   */
  protected getProgress(): number {
    const result = this.progress.done / this.progress.all;
    return Math.round(result * 10000) / 10000;
  }

  /**
   * Initialize progress with setting total records
   *
   * @protected
   * @param {number} records
   * @memberof Job
   */
  protected initProgress(records: number): void {
    this.progress.all = records;
  }

  /**
   * Increment current progress, emit update if greater than zero
   *
   * @protected
   * @param {number} done
   * @returns {Promise<void>}
   * @memberof Job
   */
  protected async incrementProgress(done: number): Promise<void> {
    this.progress.done += done;

    const current = this.getProgress();
    if (!current)
      return;

    await this.job.updateProgress(current);
  }

  /**
   * Set current progress, emit update if greater than zero
   *
   * @protected
   * @param {number} done
   * @returns {Promise<void>}
   * @memberof Job
   */
  protected async setProgress(done: number): Promise<void> {
    this.progress.done = done;

    const current = this.getProgress();
    if (!current)
      return;

    await this.job.updateProgress(current);
  }
}
