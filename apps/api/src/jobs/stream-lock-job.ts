import type { IoC } from '@intake24/api/ioc';
import type { JobType } from '@intake24/common/types';

import { sleep } from '@intake24/api/util';

import BaseJob from './job';

/*
 * Helper class for jobs that are consuming CSV stream
 * - use for locking when back fo data is processed
 * - prevents race conditions between `data`/`end` event at the end of csv stream
 */
export default abstract class StreamLockJob<T extends JobType> extends BaseJob<T> {
  private locked = false;

  private unlockInterval = 500;

  constructor({ logger }: Pick<IoC, 'logger'>) {
    super({ logger });
  }

  protected isLocked(): boolean {
    return this.locked;
  }

  protected lock(): void {
    this.locked = true;
  }

  protected unlock(): void {
    this.locked = false;
  }

  protected async waitForUnlock(): Promise<void> {
    while (this.isLocked()) await sleep(this.unlockInterval);
  }

  protected setUnlockInterval(ms: number): void {
    this.unlockInterval = ms;
  }
}
