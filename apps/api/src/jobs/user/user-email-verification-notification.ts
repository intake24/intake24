import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import ms from 'ms';
import nunjucks from 'nunjucks';

import { getFrontEndUrl, getUAInfo } from '@intake24/api/util';
import { User } from '@intake24/db';

import BaseJob from '../job';

export default class UserEmailVerificationNotification extends BaseJob<'UserEmailVerificationNotification'> {
  readonly name = 'UserEmailVerificationNotification';

  private readonly appConfig;

  private readonly adminSignupService;

  private readonly mailer;

  constructor({
    appConfig,
    adminSignupService,
    logger,
    mailer,
  }: Pick<IoC, 'appConfig' | 'logger' | 'mailer' | 'adminSignupService'>) {
    super({ logger });

    this.appConfig = appConfig;
    this.adminSignupService = adminSignupService;
    this.mailer = mailer;
  }

  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof UserPasswordResetNotification
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.logger.debug('Job started.');

    const { email } = this.params;

    const user = await this.getUser();
    if (!user) {
      this.logger.warn(`User with email ${email} not found in database.`);
      return;
    }

    await this.sendEmail(user);

    this.logger.debug('Job finished.');
  }

  private async getUser(): Promise<User | null> {
    const { email } = this.params;

    return User.findOne({ attributes: ['id', 'name'], where: { email: { [User.op('ciEq')]: email } } });
  }

  private async sendEmail(user: User) {
    const { email, userAgent } = this.params;
    const { id: userId, name } = user;

    const { base, admin } = this.appConfig.urls;

    const uaInfo = getUAInfo(userAgent);

    const { token, expiresIn } = await this.adminSignupService.createVerificationToken(userId);
    const domain = getFrontEndUrl(base, admin);
    const url = `${domain}/verify?token=${token}`;
    const subject = `${this.appConfig.fullName}: Verify email`;

    const html = nunjucks.render('mail/user/email-verification.njk', {
      title: subject,
      email,
      name: name ?? '',
      uaInfo,
      expiresIn: ms(ms(expiresIn), { long: true }),
      action: { url, text: 'Verify email' },
    });
    await this.mailer.sendMail({ to: email, subject, html });
  }
}
