import type { Job } from 'bullmq';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from '@json2csv/node';
import fs from 'fs-extra';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { addTime } from '@intake24/api/util';
import { Job as DbJob } from '@intake24/db';
import BaseJob from '../job';

export default class SurveyDataExport extends BaseJob<'SurveyDataExport'> {
  readonly name = 'SurveyDataExport';

  private dbJob!: DbJob;

  private readonly dataExportService;

  private readonly fsConfig;

  constructor({
    fsConfig,
    dataExportService,
    logger,
  }: Pick<IoC, 'fsConfig' | 'dataExportService' | 'logger'>) {
    super({ logger });

    this.fsConfig = fsConfig;
    this.dataExportService = dataExportService;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SurveyDataExport
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.exportData();

    this.logger.debug('Job finished.');
  }

  /**
   *
   *
   * @private
   * @returns {Promise<void>}
   * @memberof SurveyDataExport
   */
  private async exportData(): Promise<void> {
    const { options, fields, filename, total } = await this.dataExportService.prepareExportInfo(
      this.params,
    );

    this.initProgress(total);

    let counter = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(counter);
    }, 2000);

    const filepath = path.resolve(this.fsConfig.local.downloads, filename);
    const foods = this.dataExportService.getSubmissionsWithStream(options);
    const transform = new Transform({ fields, withBOM: true }, {}, { objectMode: true });
    const output = fs.createWriteStream(filepath, { encoding: 'utf-8', flags: 'w+' });

    transform.on('data', () => {
      counter++;
    });

    try {
      await pipeline(foods, transform, output);
      await this.dbJob.update({
        downloadUrl: filename,
        downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
      });
    }
    finally {
      this.logger.debug('Clearing progress interval.');
      clearInterval(progressInterval);
    }
  }
}
