import z from 'zod';
import { captchaProviders } from '@intake24/common/security';

export const baseEMProvider = z.object({
  lists: z.object({
    newsletter: z.string().default(''),
    support: z.string().default(''),
  }),
});
export type BaseEMProvider = z.infer<typeof baseEMProvider>;

export const servicesConfig = z.object({
  ietfLocales: z.object({
    url: z.string().url().default('https://cdn.simplelocalize.io/public/v1/locales'),
  }),
  captcha: z.object({
    provider: z.enum(captchaProviders).nullable().default(null),
    secret: z.string().default(''),
  }),
  webPush: z.object({
    subject: z.string().default(''),
    publicKey: z.string().default(''),
    privateKey: z.string().default(''),
  }),
  comms: z.object({
    provider: z.enum(['email-blaster']).nullable().default(null),
    'email-blaster': baseEMProvider.extend({
      url: z.string().url().default('https://api.emailblaster.cloud/2.0'),
      apiKey: z.string().default(''),
    }),
  }).superRefine(
    (val, ctx) => {
      if (!val.provider)
        return;

      if (!val[val.provider].lists.newsletter || !val[val.provider].lists.support) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Missing mailing lists configuration',
          path: ['email-blaster', 'lists'],
        });
      }

      if (val.provider === 'email-blaster' && !val['email-blaster'].apiKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Missing Email Blaster API key',
        });
      }
    },
  ),
});
export type ServicesConfig = z.infer<typeof servicesConfig>;
export type CaptchaConfig = ServicesConfig['captcha'];
export type WebPushConfig = ServicesConfig['webPush'];
export type CommsConfig = ServicesConfig['comms'];
export type IetfLocalesConfig = ServicesConfig['ietfLocales'];

export default servicesConfig.parse({
  ietfLocales: {
    url: process.env.IETF_LANGUAGE_TAG_URL,
  },
  captcha: {
    provider: process.env.CAPTCHA_PROVIDER,
    secret: process.env.CAPTCHA_SECRET,
  },
  webPush: {
    subject: process.env.WEBPUSH_SUBJECT,
    publicKey: process.env.WEBPUSH_PUBLIC_KEY,
    privateKey: process.env.WEBPUSH_PRIVATE_KEY,
  },
  comms: {
    provider: process.env.COMMS_PROVIDER,
    'email-blaster': {
      url: process.env.COMMS_EMAIL_BLASTER_URL,
      apiKey: process.env.COMMS_EMAIL_BLASTER_API_KEY,
      lists: {
        newsletter: process.env.COMMS_EMAIL_BLASTER_NEWSLETTER,
        support: process.env.COMMS_EMAIL_BLASTER_SUPPORT,
      },
    },
  },
});
