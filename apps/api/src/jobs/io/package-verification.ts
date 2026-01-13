import type { Job } from 'bullmq';

import type {
  PackageHandler,
  PackageHandlerContext,
} from './package-handlers';
import type { IoC } from '@intake24/api/ioc';
import type { ImportPackageFormat, PackageContentsSummary } from '@intake24/common/types/http/admin/io';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { LocalisableError, NotFoundError } from '@intake24/api/http/errors';
import { Job as DbJob } from '@intake24/db';

import BaseJob from '../job';
import {
  AlbanePackageHandler,
  Intake24PackageHandler,
} from './package-handlers';
import { checkEditFoodListPermissions } from './permission-checks';

export default class PackageVerification extends BaseJob<'PackageVerification', PackageContentsSummary> {
  readonly name = 'PackageVerification';

  private dbJob!: DbJob;

  private readonly globalAclService;

  private userId!: string;

  constructor({ logger, globalAclService }: Pick<IoC, 'logger' | 'globalAclService'>) {
    super({ logger });

    this.globalAclService = globalAclService;
  }

  public async run(job: Job): Promise<PackageContentsSummary> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job record not found in database: ${this.name} ${this.dbId}`);

    if (!dbJob.userId)
      throw new NotFoundError(`No user ID associated with job: ${this.name} ${this.dbId}`);

    this.dbJob = dbJob;
    this.userId = dbJob.userId;

    this.logger.debug('Job started.');

    const result = await this.verifyPackage();

    this.logger.debug('Job finished.');

    return result;
  }

  private createPackageHandler(context: PackageHandlerContext): PackageHandler {
    const { packageFormat } = this.params;

    switch (packageFormat as ImportPackageFormat) {
      case 'albane':
        return new AlbanePackageHandler(context);
      case 'intake24':
      default:
        return new Intake24PackageHandler(context);
    }
  }

  private async verifyPackage(): Promise<PackageContentsSummary> {
    const { fileId } = this.params;
    // FIXME: make tus upload dir configurable
    const uploadedPath = path.join(os.tmpdir(), 'large-file-uploads', fileId);

    try {
      await fs.stat(uploadedPath);
    }
    catch (err) {
      throw new LocalisableError('io.verification.uploadedFileNotAccessible', undefined, { cause: err });
    }

    const context: PackageHandlerContext = {
      fileId,
      userId: this.userId,
      logger: this.logger,
      globalAclService: this.globalAclService,
    };

    const handler = this.createPackageHandler(context);

    try {
      if (!(await this.globalAclService.hasPermission(this.userId, 'import-package')))
        throw new LocalisableError('io.verification.importPermission');

      const result = await handler.verify(uploadedPath);

      const targetLocales = result.summary.targetLocales;
      if (targetLocales.length > 0) {
        await checkEditFoodListPermissions(this.globalAclService, this.userId, new Set(targetLocales));
      }

      return result.summary;
    }
    catch (err) {
      // On failure, cleanup extracted/converted files
      await handler.cleanup();
      throw err;
    }
    finally {
      // Always delete uploaded file regardless of conversion outcome
      await fs.unlink(uploadedPath);
    }
  }
}
