import type { Job } from 'bullmq';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from '@json2csv/node';
import { format as formatDate } from 'date-fns';
import fs from 'fs-extra';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import { surveyUrlService } from '@intake24/api/services';
import { addTime } from '@intake24/api/util';
import { Job as DbJob, Survey, UserSurveyAlias } from '@intake24/db';
import BaseJob from '../job';

export default class SurveyAuthUrlsExport extends BaseJob<'SurveyAuthUrlsExport'> {
  readonly name = 'SurveyAuthUrlsExport';

  private dbJob!: DbJob;

  private readonly appConfig;

  private readonly fsConfig;

  constructor({ appConfig, fsConfig, logger }: Pick<IoC, 'appConfig' | 'fsConfig' | 'logger'>) {
    super({ logger });

    this.appConfig = appConfig;
    this.fsConfig = fsConfig;
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

    await this.download();

    this.logger.debug('Job finished.');
  }

  /**
   *
   *
   * @private
   * @returns {Promise<void>}
   * @memberof SurveyAuthUrlsExport
   */
  private async download(): Promise<void> {
    const { surveyId } = this.params;

    const survey = await Survey.findByPk(surveyId, {
      attributes: ['id', 'slug', 'authUrlDomainOverride'],
    });
    if (!survey)
      throw new NotFoundError(`Job ${this.name}: Survey record not found (${surveyId}).`);

    const { slug, authUrlDomainOverride } = survey;
    const urlService = surveyUrlService(this.appConfig.urls, slug, authUrlDomainOverride);

    const timestamp = formatDate(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${slug}-${timestamp}.csv`;

    const total = await UserSurveyAlias.count({ where: { surveyId } });
    this.initProgress(total);

    let counter = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(counter);
    }, 2000);

    const aliases = UserSurveyAlias.findAllWithStream({ where: { surveyId } });
    const transform = new Transform(
      {
        fields: [
          { label: 'UserID', value: 'userId' },
          { label: 'Username', value: 'username' },
          { label: 'AuthenticationToken', value: (row: UserSurveyAlias) => row.urlAuthToken },
          {
            label: 'ShortSurveyAuthenticationURL',
            value: (row: UserSurveyAlias) => urlService.getSurveyUrl(row.urlAuthToken),
          },
          {
            label: 'SurveyAuthenticationURL',
            value: (row: UserSurveyAlias) => urlService.getSurveyUrl(row.urlAuthToken, true),
          },
          {
            label: 'FeedbackAuthenticationURL',
            value: (row: UserSurveyAlias) => urlService.getFeedbackUrl(row.urlAuthToken),
          },
        ],
        withBOM: true,
      },
      {},
      { objectMode: true },
    );
    const output = fs.createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), {
      encoding: 'utf-8',
      flags: 'w+',
    });

    transform.on('data', () => {
      counter++;
    });

    try {
      await pipeline(aliases, transform, output);
      await this.dbJob.update({
        downloadUrl: filename,
        downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
      });
    }
    finally {
      clearInterval(progressInterval);
    }
  }
}
