import type { Job } from 'bullmq';

import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';

import { Job as DbJob } from '@intake24/db';
import BaseJob from '../job';

export default class PackageExport extends BaseJob<'PackageExport'> {
  readonly name = 'PackageExport';

  private dbJob!: DbJob;

  private readonly fsConfig;
  private readonly packageExportService;

  constructor({ fsConfig, logger, packageExportService }: Pick<IoC, 'fsConfig' | 'logger' | 'packageExportService'>) {
    super({ logger });

    this.fsConfig = fsConfig;
    this.packageExportService = packageExportService;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.exportPackage();

    this.logger.debug('Job finished.');
  }

  private async exportPackage(): Promise<void> {
    await this.packageExportService(this.params);
  }
}
