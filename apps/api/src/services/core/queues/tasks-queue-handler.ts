import type { Job as BullJob } from 'bullmq';
import { Queue, Worker } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { Job } from '@intake24/api/jobs';
import type { JobData } from '@intake24/common/types';
import { Task } from '@intake24/db';

import { QueueHandler } from './queue-handler';

export default class TasksQueueHandler extends QueueHandler<JobData> {
  readonly name = 'tasks';

  private readonly resolveDynamic;

  /**
   * Creates an instance of TasksQueueHandler.
   * @param {IoC} { logger }
   * @memberof TasksQueueHandler
   */
  constructor({ logger, queueConfig, resolveDynamic }: Pick<IoC, 'logger' | 'queueConfig' | 'resolveDynamic'>) {
    super(queueConfig, logger.child({ service: 'TasksQueueHandler' }));
    this.resolveDynamic = resolveDynamic;
  }

  /**
   * Initialize TasksQueueHandler
   *
   * @memberof TasksQueueHandler
   */
  public async init() {
    const options = this.getOptions();

    this.queue = new Queue(this.name, {
      ...options,
      defaultJobOptions: {
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 24 * 3600 },
      },
    });
    this.queue.on('error', (err) => {
      this.logEventError(err);
    });

    const worker = new Worker(this.name, this.processor.bind(this), options);

    worker
      .on('completed', (job) => {
        this.logger.info(`${this.name}: ${job.name} | ${job.id} has completed.`);
      })
      .on('failed', (job, err) => {
        const { message, name, stack } = err;
        const jobInfo = job ? `${job.name} | ${job.id}` : `"Removed job"`;

        this.logger.error(`${this.name}: ${jobInfo} has failed with: ${err.message}`, {
          message,
          name,
          stack,
        });
      })
      .on('error', (err) => {
        this.logEventError(err);
      });

    this.workers.push(worker);

    this.initQueueEvents();

    await this.clearScheduledJobs();
    await this.loadScheduledJobs();

    this.logger.info(`${this.name} has been loaded.`);
  }

  async processor(job: BullJob<JobData>) {
    const { id, data: { type } } = job;

    if (!id) {
      this.logger.error(`Queue ${this.name}: Job ID missing.`);
      return;
    }

    const newJob = this.resolveDynamic<Job<typeof type>>(type);
    await newJob.run(job);
  }

  private async clearScheduledJobs() {
    const repeatableJobs = await this.queue.getJobSchedulers();

    await Promise.all(repeatableJobs.map(job => this.queue.removeJobScheduler(job.key)));
  }

  private createJobParams(task: Task) {
    const { name, job, cron, params } = task;

    return {
      name,
      data: { type: job, params },
      opts: { pattern: cron },
    };
  }

  private async loadScheduledJobs() {
    const tasks = await Task.findAll({ where: { active: true } });

    for (const task of tasks) {
      const { name, data, opts } = this.createJobParams(task);
      await this.queue.upsertJobScheduler(`db-${task.id}`, opts, { name, data });
    }
  }

  private async getScheduledJobByKey(key: string) {
    const jobs = await this.queue.getJobSchedulers();

    return jobs.find(job => job.key === key);
  }

  async getScheduledJobById(id: string) {
    return await this.getScheduledJobByKey(`db-${id}`);
  }

  private async removeScheduledJobById(id: string) {
    const job = await this.getScheduledJobById(id);
    if (!job) {
      this.logger.debug(`Queue ${this.name}: Scheduled task (ID: ${id}) not in queue.`);
      return undefined;
    }

    return await this.queue.removeJobScheduler(job.key);
  }

  public async updateTaskInQueue(task: Task) {
    const { id, active } = task;

    if (!active) {
      await this.removeScheduledJobById(id);
      return;
    }

    const { name, data, opts } = this.createJobParams(task);
    const job = await this.queue.upsertJobScheduler(`db-${id}`, opts, { name, data });

    this.logger.debug(`Queue ${this.name}: Task (ID: ${id}, Name: ${name}) updated.`);

    return job;
  }

  public async removeTaskFromQueue(task: Task) {
    const { id, name } = task;

    await this.removeScheduledJobById(id);

    this.logger.debug(`Queue ${this.name}: Task (ID: ${id}, Name: ${name}) updated.`);
  }

  public async pauseAll() {
    await this.clearScheduledJobs();
  }

  public async resumeAll() {
    await this.loadScheduledJobs();
  }
}
