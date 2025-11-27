import type { Job, Queue, QueueBaseOptions, Worker } from 'bullmq';

import { EventEmitter } from 'node:events';
import type { QueueConfig } from '@intake24/api/config';
import type { Logger } from '@intake24/common-backend';

export interface QueueHandlerEvents<T>
{
  completed: (job: Job<T>) => void;
  failed: (job: Job<T> | undefined, error: Error) => void;
}

export class QueueHandlerEventEmitter<T> extends EventEmitter {
  emit<K extends keyof QueueHandlerEvents<T>>(event: K, ...args: Parameters<QueueHandlerEvents<T>[K]>): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof QueueHandlerEvents<T>>(event: K, listener: QueueHandlerEvents<T>[K]): this {
    return super.on(event, listener);
  }

  off<K extends keyof QueueHandlerEvents<T>>(event: K, listener: QueueHandlerEvents<T>[K]): this {
    return super.off(event, listener);
  }
}

export abstract class QueueHandler<T = any> {
  abstract readonly name: string;

  protected queue!: Queue<T>;
  protected workers: Worker<T>[] = [];

  public readonly queueEvents: QueueHandlerEventEmitter<T>;

  protected readonly config;
  protected readonly logger;

  abstract init(): Promise<void>;
  abstract processor(job: Job<T>, token?: string): Promise<void>;

  constructor(config: QueueConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.queueEvents = new QueueHandlerEventEmitter<T>();
  }

  protected getOptions(): QueueBaseOptions {
    const { keyPrefix, ...connection } = this.config.redis;

    return { connection, prefix: keyPrefix };
  };

  protected logEventError(err: unknown) {
    if (err instanceof Error) {
      const { message, name, stack } = err;
      this.logger.error(`${name}: ${message}`, { stack });
      return;
    }

    this.logger.error(`Unknown event error: ${err}`);
  }

  // There is a QueueEvents class for this in BullMQ but it is very finnicky
  protected initQueueEvents() {
    for (const worker of this.workers) {
      worker.on('completed', job => this.queueEvents.emit('completed', job));
      worker.on('failed', (job, err) => this.queueEvents.emit('failed', job, err));
    }
  }

  public async closeWorkers(force = false) {
    await Promise.all(this.workers.map(worker => worker.close(force)));
  }

  public async close() {
    await this.closeWorkers();
    await this.queue.close();
  }
}
