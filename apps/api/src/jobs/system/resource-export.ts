import type { Job } from 'bullmq';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { format as formatDate } from 'date-fns';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { addTime } from '@intake24/api/util';
import { Job as DbJob } from '@intake24/db';
import BaseJob from '../job';
import resourceExports from './resources';

export default class ResourceExport extends BaseJob<'ResourceExport'> {
  readonly name = 'ResourceExport';

  private dbJob!: DbJob;

  private readonly config;
  private readonly kyselyDb;

  constructor({ config, kyselyDb, logger }: Pick<IoC, 'config' | 'kyselyDb' | 'logger'>) {
    super({ logger });

    this.config = config;
    this.kyselyDb = kyselyDb;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SurveyAuthUrlsExport
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.export();

    this.logger.debug('Job finished.');
  }

  private async export(): Promise<void> {
    const { config, kyselyDb, params } = this;
    const { resource } = params;

    const { records, total, transform } = await resourceExports[resource]({ config, kyselyDb, params });
    const timestamp = formatDate(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${resource}-${timestamp}.csv`;

    this.initProgress(total);

    let counter = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(counter);
    }, 2000);

    const output = createWriteStream(
      path.resolve(this.config.filesystem.local.downloads, filename),
      { encoding: 'utf-8', flags: 'w+' },
    );
    transform.on('data', () => {
      counter++;
    });

    try {
      await pipeline(records, transform, output);
      await this.dbJob.update({
        downloadUrl: filename,
        downloadUrlExpiresAt: addTime(this.config.filesystem.urlExpiresAt),
      });
    }
    finally {
      clearInterval(progressInterval);
    }
  }
}
