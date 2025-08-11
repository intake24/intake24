import type { SendMailOptions, Transporter } from 'nodemailer';
import type { MailConfig } from './config';
import { inline } from '@css-inline/css-inline';
import { convert } from 'html-to-text';
import nodemailer from 'nodemailer';
import type { Logger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';

export type MailerOps = {
  environment: Environment;
  mailConfig: MailConfig;
  logger: Logger;
};

export class Mailer {
  private readonly environment;

  private readonly mailConfig;

  private readonly logger;

  private transporter!: Transporter;

  constructor({ environment, mailConfig, logger }: MailerOps) {
    this.environment = environment;
    this.mailConfig = mailConfig;
    this.logger = logger.child({ service: 'Mailer' });
  }

  init(): void {
    const { mailer } = this.mailConfig;
    let options = {};

    const isDev = this.environment === 'development';
    const isTest = this.environment === 'test';

    switch (mailer) {
      case 'smtp':
        options = { ...this.mailConfig.mailers[mailer], pool: true, logger: isDev };
        break;
      case 'log':
      default:
        if (!isTest)
          options = { streamTransport: true };
        break;
    }

    this.transporter = nodemailer.createTransport(options);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      const { from, replyTo } = this.mailConfig;
      const defaults: SendMailOptions = {
        from,
        replyTo,
        headers: { 'X-Auto-Response-Suppress': 'All' },
      };

      let { html } = options;
      let text: string | undefined;

      if (html && typeof html === 'string') {
        html = inline(html) as string;
        text = convert(html, {
          selectors: [
            { selector: '.header', format: 'skip' },
            { selector: 'img', format: 'skip' },
          ],
        });
      }

      const info = await this.transporter.sendMail({ ...defaults, ...options, html, text });

      this.logger.info(info.messageId);

      // TODO: pipe it to winston logger
      if (this.mailConfig.mailer === 'log')
        info.message.pipe(process.stdout);
    }
    catch (err) {
      if (err instanceof Error) {
        const { message, name, stack } = err;
        this.logger.error(`${name}: ${message}`, { stack });
        return;
      }

      this.logger.error(err);
    }
  }
}
