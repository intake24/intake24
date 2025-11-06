import type { Job } from 'bullmq';
import type { IoC } from '@intake24/api/ioc';
import BaseJob from '../job';

export default class SurveySubmission extends BaseJob<'SurveySubmission'> {
  readonly name = 'SurveySubmission';

  private readonly surveySubmissionService;

  constructor({
    logger,
    surveySubmissionService,
  }: Pick<IoC, 'logger' | 'surveySubmissionService'>) {
    super({ logger });

    this.surveySubmissionService = surveySubmissionService;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SurveySubmission
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    const { surveyId, userId, state } = this.params;

    await this.surveySubmissionService.processSubmission(surveyId, userId, state);

    this.logger.debug('Job finished.');
  }
}
