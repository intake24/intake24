import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import fs from 'fs-extra';
import nunjucks from 'nunjucks';

import BaseJob from '../job';

export default class SurveyFeedbackNotification extends BaseJob<'SurveyFeedbackNotification'> {
  readonly name = 'SurveyFeedbackNotification';

  private readonly appConfig;

  private readonly feedbackService;

  private readonly mailer;

  constructor({
    appConfig,
    feedbackService,
    logger,
    mailer,
  }: Pick<IoC, 'appConfig' | 'feedbackService' | 'logger' | 'mailer'>) {
    super({ logger });

    this.appConfig = appConfig;
    this.feedbackService = feedbackService;
    this.mailer = mailer;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SendRespondentFeedback
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    const { surveyId, username, submissions, lang, to, cc, bcc } = this.params;
    const subject = `${this.appConfig.fullName}: My dietary feedback`;
    const filename = `Intake24-MyFeedback-${new Date().toISOString().substring(0, 10)}.pdf`;
    const { path, url } = await this.feedbackService.getFeedbackFile({ surveyId, username, submissions, lang });
    const html = nunjucks.render('mail/surveys/feedback.njk', {
      title: subject,
      action: { url, text: 'Download feedback' },
    });

    await this.mailer.sendMail({
      to,
      cc,
      bcc,
      subject,
      html,
      attachments: [
        { contentDisposition: 'attachment', contentType: 'application/pdf', path, filename },
      ],
    });

    await fs.remove(path);

    this.logger.debug('Job finished.');
  }
}
