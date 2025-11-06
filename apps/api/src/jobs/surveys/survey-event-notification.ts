import type { Job } from 'bullmq';
import axios from 'axios';
import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type { WebhookNotification } from '@intake24/common/types';
import { submissionScope, Survey, SurveySubmission } from '@intake24/db';
import NotificationJob from '../notification-job';

export default class SurveyEventNotification extends NotificationJob<'SurveyEventNotification'> {
  readonly name = 'SurveyEventNotification';

  constructor({ appConfig, jwtService, logger }: Pick<IoC, 'appConfig' | 'jwtService' | 'logger'>) {
    super({ appConfig, jwtService, logger });
  }

  public async run(job: Job) {
    this.init(job);

    this.logger.debug('Job started.');

    await this.dispatchNotifications();

    this.logger.debug('Job finished.');
  }

  private async getSubmission(submissionId: string) {
    const submission = await SurveySubmission.findByPk(submissionId, submissionScope());
    if (!submission)
      throw new NotFoundError('Submission not found');

    return submission;
  }

  private async getEventPayload() {
    switch (this.params.type) {
      case 'survey.session.submitted':
        return this.getSubmission(this.params.submissionId);
      case 'survey.session.started':
      case 'survey.session.cancelled':
      default:
        return undefined;
    }
  }

  private async dispatchNotifications() {
    const { surveyId, type } = this.params;

    const survey = await Survey.findByPk(surveyId, {
      attributes: ['id', 'notifications', 'genUserKey'],
    });
    if (!survey)
      throw new NotFoundError('Survey not found');

    const { notifications, genUserKey } = survey;
    const webhooks = notifications.filter(
      (n): n is WebhookNotification => n.type === type && n.channel === 'webhook',
    );
    if (!webhooks.length) {
      this.logger.warn(`Event '${type}' notification not set for survey ${surveyId}`);
      return;
    }

    const [data, ...headers] = await Promise.all([
      this.getEventPayload(),
      ...webhooks.map(n =>
        this.getSignatureHeaders(
          n.url,
          genUserKey ? { payload: this.params, secret: genUserKey } : undefined,
        ),
      ),
    ]);

    await Promise.all(
      webhooks.map((n, i) => axios.post(n.url, { ...this.params, data }, { headers: headers[i], timeout: 15000 })),
    );
  }
}
