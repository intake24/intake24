import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { Transform } from '@json2csv/node';
import { format as formatDate } from 'date-fns';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import { Job as DbJob, Survey, UserSurveySession } from '@intake24/db';

import BaseJob from '../job';

export default class SurveySessionsExport extends BaseJob<'SurveySessionsExport'> {
  readonly name = 'SurveySessionsExport';

  private dbJob!: DbJob;

  private readonly fsConfig;

  constructor({ fsConfig, logger }: Pick<IoC, 'fsConfig' | 'logger'>) {
    super({ logger });

    this.fsConfig = fsConfig;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SurveySessionsExport
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
   * @memberof SurveySessionsExport
   */
  private async download(): Promise<void> {
    const { surveyId } = this.params;

    const survey = await Survey.findByPk(surveyId, { attributes: ['id', 'slug'] });
    if (!survey)
      throw new NotFoundError(`Job ${this.name}: Survey record not found (${surveyId}).`);

    const { slug } = survey;
    const timestamp = formatDate(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${slug}-${timestamp}.csv`;

    const total = await UserSurveySession.count({ where: { surveyId } });
    const sessions = UserSurveySession.findAllWithStream({
      where: { surveyId },
      include: [{ association: 'alias', attributes: ['username'], where: { surveyId } }],
    });

    this.initProgress(total);

    let counter = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(counter);
    }, 2000);

    const transform = new Transform(
      {
        fields: [
          { label: 'sessionId', value: 'id' },
          { label: 'surveyId', value: 'surveyId' },
          { label: 'userId', value: 'userId' },
          { label: 'username', value: 'alias.username' },
          { label: 'createdAt', value: 'createdAt' },
          { label: 'updatedAt', value: 'updatedAt' },
          { label: 'startTime', value: 'sessionData.startTime' },
          { label: 'endTime', value: 'sessionData.endTime' },
          { label: 'submissionTime', value: 'sessionData.submissionTime' },
          { label: 'state', value: 'sessionData' },
        ],
        withBOM: true,
      },
      {},
      { objectMode: true },
    );
    const output = createWriteStream(path.resolve(this.fsConfig.local.downloads, filename), {
      encoding: 'utf-8',
      flags: 'w+',
    });

    transform.on('data', () => {
      counter++;
    });

    try {
      await pipeline(sessions, transform, output);
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
