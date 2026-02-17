import z from 'zod';

import { validateConfig } from '../../util';

export const mailerType = z.enum(['smtp', 'log']);
export type MailerType = z.infer<typeof mailerType>;

export const logMailer = z.object({
  transport: z.literal('log'),
});
export type LogMailer = z.infer<typeof logMailer>;

export const smtpMailer = z.object({
  transport: z.literal('smtp'),
  host: z.string().default('localhost'),
  port: z.coerce.number().int().positive().default(25),
  secure: z.boolean().or(z.stringbool()).default(false),
  ignoreTLS: z.boolean().or(z.stringbool()).default(false),
  auth: z.object({
    user: z.string(),
    pass: z.string(),
  }).optional(),
});
export type SMTPMailer = z.infer<typeof smtpMailer>;

export const mailConfigSchema = z.object({
  mailer: mailerType.default('log'),
  mailers: z.object({
    smtp: smtpMailer,
    log: logMailer,
  }),
  from: z.object({
    address: z.string().default('no-reply@domain.com'),
    name: z.string().default('Intake24'),
  }),
  replyTo: z.email().optional(),
});
export type MailConfig = z.infer<typeof mailConfigSchema>;

const user = process.env.MAIL_USERNAME || null;
const pass = process.env.MAIL_PASSWORD || null;
const auth = user && pass ? { user, pass } : undefined;

const rawMailConfig = {
  mailer: process.env.MAIL_MAILER,
  mailers: {
    smtp: {
      transport: 'smtp',
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_SECURE,
      ignoreTLS: process.env.MAIL_IGNORE_TLS,
      auth,
    },
    log: {
      transport: 'log',
    },
  },
  from: {
    address: process.env.MAIL_FROM_ADDRESS,
    name: process.env.MAIL_FROM_NAME,
  },

  replyTo: process.env.MAIL_REPLY_TO_ADDRESS,
};

export const mailConfig = validateConfig('Mail configuration', mailConfigSchema, rawMailConfig);
