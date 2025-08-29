import type { Job } from 'bullmq';
import path from 'node:path';
import fs from 'fs-extra';
import type { LocalLocation } from '@intake24/api/config/filesystem';
import type { IoC } from '@intake24/api/ioc';
import { addTime } from '@intake24/api/util';
import BaseJob from '../job';

export default class CleanStorageFiles extends BaseJob<'CleanStorageFiles'> {
  readonly name = 'CleanStorageFiles';

  private readonly config;

  constructor({ fsConfig, logger }: Pick<IoC, 'fsConfig' | 'logger'>) {
    super({ logger });

    this.config = fsConfig;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof CleanStorageFiles
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    const dirs: LocalLocation[] = ['downloads', 'uploads'];

    for (const dir of dirs)
      await this.cleanDir(this.config.local[dir]);

    this.logger.debug('Job finished.');
  }

  /**
   * Clean selected directory
   *
   * @private
   * @param {string} dir
   * @param {string} [expiresIn]
   * @returns {Promise<void>}
   * @memberof CleanStorageFiles
   */
  private async cleanDir(dir: string, expiresIn = '1h'): Promise<void> {
    this.logger.debug(`Cleaning of '${dir}' folder started.`);

    const files = await fs.readdir(path.resolve(dir));
    const now = new Date();

    for (const file of files) {
      const filepath = path.resolve(dir, file);
      const stats = await fs.stat(filepath);
      const expiresAt = addTime(expiresIn, stats.ctime);

      if (expiresAt > now)
        continue;

      await fs.rm(filepath, { recursive: true, force: true });
    }

    this.logger.debug(`Cleaning of '${dir}' folder finished.`);
  }
}
