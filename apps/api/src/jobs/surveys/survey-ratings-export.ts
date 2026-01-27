import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { Transform } from '@json2csv/node';
import { format as formatDate } from 'date-fns';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import { Job as DbJob, Survey, UserSurveyRating } from '@intake24/db';

import BaseJob from '../job';

export default class SurveyRatingsExport extends BaseJob<'SurveyRatingsExport'> {
  readonly name = 'SurveyRatingsExport';

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
   * @memberof SurveyRatingsExport
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
   * @memberof SurveyRatingsExport
   */
  private async download(): Promise<void> {
    const { surveyId } = this.params;

    const survey = await Survey.findByPk(surveyId, { attributes: ['id', 'slug'] });
    if (!survey)
      throw new NotFoundError(`Job ${this.name}: Survey record not found (${surveyId}).`);

    const { slug } = survey;
    const timestamp = formatDate(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-${this.name}-${slug}-${timestamp}.csv`;

    const total = await UserSurveyRating.count({ where: { surveyId } });
    this.initProgress(total);

    let counter = 0;
    const progressInterval = setInterval(async () => {
      await this.setProgress(counter);
    }, 2000);

    const ratings = UserSurveyRating.findAllWithStream({
      where: { surveyId },
      include: [
        {
          association: 'user',
          attributes: ['id'],
          required: true,
          include: [{ association: 'aliases', attributes: ['username'], where: { surveyId } }],
        },
      ],
    });
    const transform = new Transform(
      {
        fields: [
          { label: 'UserID', value: 'userId' },
          {
            label: 'Username',
            value: (row: UserSurveyRating) => row.user?.aliases?.at(0)?.username,
          },
          { label: 'SurveyID', value: 'surveyId' },
          { label: 'SurveySlug', value: () => slug },
          { label: 'SubmissionID', value: 'submissionId' },
          { label: 'Type', value: 'type' },
          { label: 'Rating', value: 'rating' },
          { label: 'Comment', value: 'comment' },
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
      await pipeline(ratings, transform, output);
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
