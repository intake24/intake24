import type { Job as BullJob, JobsOptions } from 'bullmq';
import type { PushPayload } from '..';

import { Queue, Worker } from 'bullmq';
import type { IoC } from '@intake24/api/ioc';
import type { Job } from '@intake24/api/jobs';
import type { JobData, JobParams, JobType } from '@intake24/common/types';

import { Job as DbJob, Op } from '@intake24/db';
import { QueueHandler } from './queue-handler';

export type JobInput<T extends JobType> = {
  type: T;
  params: JobParams[T];
  userId?: string | null;
};

export type NotificationPayload = {
  jobId: string;
  status: 'success' | 'error';
  message?: string;
};

export default class JobsQueueHandler extends QueueHandler<JobData> {
  readonly name = 'jobs';

  private readonly pusher;
  private readonly resolveDynamic;

  /**
   * Creates an instance of JobsQueueHandler
   *
   * @param {string} name
   * @memberof JobsQueueHandler
   */
  constructor({ queueConfig, logger, pusher, resolveDynamic }: Pick<IoC, 'queueConfig' | 'logger' | 'pusher' | 'resolveDynamic'>) {
    super(queueConfig, logger.child({ service: 'JobsQueueHandler' }));
    this.pusher = pusher;
    this.resolveDynamic = resolveDynamic;
  }

  /**
   * Initialize JobsQueueHandler
   *
   * @memberof JobsQueueHandler
   */
  public async init() {
    const options = this.getOptions();

    this.queue = new Queue(this.name, {
      ...options,
      defaultJobOptions: {
        delay: 500,
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 24 * 3600 },
      },
    });
    this.queue.on('error', (err) => {
      this.logEventError(err);
    });

    for (let i = 0; i < this.config.workers; i++) {
      const worker = new Worker(this.name, this.processor.bind(this), options);

      worker
        .on('progress', async (job, progress) => {
          this.logger.debug(`${this.name}: ${job.name} | ${job.id} progress has been updated.`);

          const dbId = job.id?.replace('db-', '');
          if (!dbId) {
            this.logger.error(`${this.name}: ${job.name} | Missing queue job ID.`);
            return;
          }

          if (typeof progress === 'number' && progress < 1) {
            try {
              await DbJob.update(
                { progress },
                { where: { id: dbId, progress: { [Op.lt]: progress } } },
              );
            }
            catch (err) {
              this.logEventError(err);
            }
          }
        })
        .on('completed', async (job) => {
          this.logger.info(`${this.name}: ${job.name} | ${job.id} has completed.`);

          const dbId = job.id?.replace('db-', '');
          if (!dbId) {
            this.logger.error(`${this.name}: ${job.name} | Missing queue job ID.`);
            return;
          }

          try {
            const dbJob = await DbJob.findByPk(dbId);
            if (!dbJob) {
              this.logger.error(`${this.name}: ${job.name} | ${job.id} not found.`);
              return;
            }

            await Promise.all([
              dbJob.update({ completedAt: new Date(), progress: 1, successful: true }),
              this.notify(dbJob.userId, { jobId: dbId, status: 'success' }),
            ]);
          }
          catch (err) {
            this.logEventError(err);
          }
        })
        .on('failed', async (job, err) => {
          const { message, name, stack } = err;
          const jobInfo = job ? `${job.name} | ${job.id}` : `"Removed job"`;

          this.logger.error(`${this.name}: ${jobInfo} has failed with: ${err.message}`, {
            message,
            name,
            stack,
          });

          const dbId = job?.id?.replace('db-', '');
          if (!job || !dbId) {
            this.logger.error(`${this.name}: ${job?.name} | Missing queue job ID.`);
            return;
          }

          try {
            const dbJob = await DbJob.findByPk(dbId);
            if (!dbJob) {
              this.logger.error(`${this.name}: ${job.name} | ${job.id} not found.`);
              return;
            }

            await Promise.all([
              dbJob.update({
                completedAt: new Date(),
                progress: 1,
                successful: false,
                message: job.failedReason,
                stackTrace: job.stacktrace,
              }),
              this.notify(dbJob.userId, {
                jobId: dbId,
                status: 'error',
                message: job.failedReason,
              }),
            ]);
          }
          catch (err) {
            this.logEventError(err);
          }
        })
        .on('error', (err) => {
          this.logEventError(err);
        });

      this.workers.push(worker);
    }

    this.initQueueEvents();

    this.logger.info(`Queue ${this.name} has been loaded.`);
  }

  /**
   * Queue job processor
   *
   * @param {BullJob<JobData>} job
   * @memberof JobsQueueHandler
   */
  async processor(job: BullJob<JobData>) {
    const { id, name } = job;

    if (!id) {
      this.logger.error(`Queue ${this.name}: Job ID missing.`);
      return;
    }

    const dbId = id.replace('db-', '');
    const dbJob = await DbJob.findByPk(dbId);
    if (!dbJob) {
      this.logger.error(`Queue ${this.name}: Job entry not found (${dbId}).`);
      return;
    }

    await dbJob.update({ progress: 0, startedAt: new Date() });

    const newJob = this.resolveDynamic<Job<typeof dbJob.type>>(name);
    await newJob.run(job);
  }

  /**
   * Push job into the queue
   *
   * @private
   * @param {DbJob} job
   * @param {JobsOptions} [options]
   * @memberof JobsQueueHandler
   */
  private async queueJob(job: DbJob, options: JobsOptions = {}) {
    const { id, type, params } = job;

    const bullJob = await this.queue.add(type, { type, params }, { ...options, jobId: `db-${id}` });

    this.logger.debug(`Queue ${this.name}: Job ${id} | ${type} queued.`);

    return bullJob;
  }

  /**
   * Add job to queue
   *
   * @template T
   * @param {JobInput<T>} input
   * @param {JobsOptions} [options]
   * @returns {Promise<DbJob>}
   * @memberof JobsQueueHandler
   */
  public async addJob<T extends JobType>(
    input: JobInput<T>,
    options: JobsOptions = {},
  ): Promise<DbJob> {
    const job = await DbJob.create(input);
    await this.queueJob(job, options);

    return job;
  }

  /**
   * Notify user about finished job
   *
   * @param {(string | null)} userId
   * @param {NotificationPayload} payload
   * @memberof JobsQueueHandler
   */
  public async notify(userId: string | null, payload: NotificationPayload) {
    if (!userId)
      return;

    const body = [
      'Requested action has just finished. Click on the notification to show details in application.',
    ];
    if (payload.message)
      body.push(`Details: ${payload.message}`);

    const pushPayload: PushPayload = {
      title: `${payload.status ? '✔️' : '❌'} ${payload.status.toUpperCase()}: Job has finished.`,
      body: body.join(' '),
      url: `jobs/${payload.jobId}`,
    };

    return await this.pusher.webPush(userId, pushPayload);
  }
}
