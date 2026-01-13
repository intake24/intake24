import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util/date-time';
import { Job as DbJob } from '@intake24/db';

import BaseJob from '../job';
import { checkFoodListPermissions } from './permission-checks';

export default class PackageExport extends BaseJob<'PackageExport'> {
  readonly name = 'PackageExport';

  private dbJob!: DbJob;

  private readonly fsConfig;
  private readonly packageExportService;
  private readonly globalAclService;

  constructor({ fsConfig, logger, packageExportService, globalAclService }: Pick<IoC, 'fsConfig' | 'logger' | 'packageExportService' | 'globalAclService'>) {
    super({ logger });

    this.fsConfig = fsConfig;
    this.packageExportService = packageExportService;
    this.globalAclService = globalAclService;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.checkPermissions();

    await this.exportPackage();

    this.logger.debug('Job finished.');
  }

  private async checkPermissions(): Promise<void> {
    const targetLocales = this.params.locales;
    await checkFoodListPermissions(this.globalAclService, this.dbJob.userId!, new Set(targetLocales));
  }

  private async exportPackage(): Promise<void> {
    const packageFilename = await this.packageExportService(this.params, async (progress: number) => this.job.updateProgress(progress));

    await this.dbJob.update({
      downloadUrl: packageFilename,
      downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
    });
  }
}
