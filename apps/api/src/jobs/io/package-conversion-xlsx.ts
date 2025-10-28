import type { Job } from 'bullmq';

import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { Job as DbJob } from '@intake24/db';

import BaseJob from '../job';

async function waitForSeconds(seconds: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export default class PackageConversionToXlsx extends BaseJob<'PackageConversionToXlsx'> {
  readonly name = 'PackageConversionToXlsx';

  private dbJob!: DbJob;

  private readonly fsConfig;

  constructor({ fsConfig, logger }: Pick<IoC, 'fsConfig' | 'logger'>) {
    super({ logger });

    this.fsConfig = fsConfig;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.verifyPackage();

    this.logger.debug('Job finished.');
  }

  private async verifyPackage(): Promise<void> {
    // const { uploadedPath } = this.params;

    this.initProgress(3);

    for (let i = 0; i < 3; ++i) {
      await (waitForSeconds(1));
      this.logger.info('PackageVerificationJob PackageVerificationJob PackageVerificationJob PackageVerificationJob PackageVerificationJob');
      this.setProgress(i);
    }
  }
}
