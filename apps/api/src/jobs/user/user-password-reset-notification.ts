import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';

import ms from 'ms';
import nunjucks from 'nunjucks';

import { getFrontEndUrl, getUAInfo } from '@intake24/api/util';
import { randomString } from '@intake24/common/util';
import { User, UserPasswordReset } from '@intake24/db';

import BaseJob from '../job';

export default class UserPasswordResetNotification extends BaseJob<'UserPasswordResetNotification'> {
  readonly name = 'UserPasswordResetNotification';

  private readonly appConfig;

  private readonly securityConfig;

  private readonly mailer;

  constructor({
    appConfig,
    securityConfig,
    logger,
    mailer,
  }: Pick<IoC, 'appConfig' | 'securityConfig' | 'logger' | 'mailer'>) {
    super({ logger });

    this.appConfig = appConfig;
    this.securityConfig = securityConfig;
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

    const uaInfo = getUAInfo(userAgent);

    const token = randomString(128);
    const { base, admin } = this.appConfig.urls;
    const domain = getFrontEndUrl(base, admin);

    const url = `${domain}/password/reset/${token}`;
    const { expiresIn } = this.securityConfig.passwords;
    const subject = `${this.appConfig.fullName}: Password reset`;

    await UserPasswordReset.create({ userId, token });

    const html = nunjucks.render('mail/user/password-reset.njk', {
      title: subject,
      email,
      name: name ?? '',
      uaInfo,
      expiresIn: ms(ms(expiresIn), { long: true }),
      action: { url, text: 'Reset password' },
    });

    await this.mailer.sendMail({ to: email, subject, html });
  }
}
