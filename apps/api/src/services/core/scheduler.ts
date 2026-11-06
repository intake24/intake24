import type { IoC } from '@intake24/api/ioc';

export default class Scheduler {
  private readonly logger;

  public readonly jobs;

  public readonly tasks;

  constructor({
    logger,
    jobsQueueHandler,
    tasksQueueHandler,
  }: Pick<IoC, 'logger' | 'jobsQueueHandler' | 'tasksQueueHandler'>) {
    this.logger = logger.child({ service: 'Scheduler' });

    this.jobs = jobsQueueHandler;
    this.tasks = tasksQueueHandler;
  }

  /**
   * Initialize scheduler
   *
   * @memberof Scheduler
   */
  public async init() {
    await Promise.all([
      this.jobs.init(),
      this.tasks.init(),
    ]);

    this.logger.info('Scheduler has been loaded.');
  }

  /**
   * Close all connections (queues, workers, etc.)
   *
   * @memberof Scheduler
   */
  public async close() {
    await Promise.all([
      this.jobs.close(),
      this.tasks.close(),
    ]);

    this.logger.info('Scheduler has closed all connections.');
  }

  /**
   * Close all workers before shutdown
   *
   * @memberof Scheduler
   */
  public async closeWorkers() {
    await Promise.all([
      this.jobs.closeWorkers(),
      this.tasks.closeWorkers(),
    ]);

    this.logger.info('Scheduler workers were shutdown.');
  }
}
