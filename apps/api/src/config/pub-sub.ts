import z from 'zod';

import { validateConfig } from '@intake24/common-backend';

import { redisOptionsSchema } from './redis';

export const publisherConfigSchema = z.object({
  redis: redisOptionsSchema,
});

export type PublisherConfig = z.infer<typeof publisherConfigSchema>;

export const subscriberConfigSchema = z.object({
  redis: redisOptionsSchema,
  channels: z.array(z.string().nonempty()),
});

export type SubscriberConfig = z.infer<typeof subscriberConfigSchema>;

const rawPublisherConfig = {
  redis: {
    url: process.env.PUBLISHER_REDIS_URL || process.env.REDIS_URL,
    host: process.env.PUBLISHER_REDIS_HOST || process.env.REDIS_HOST,
    port: process.env.PUBLISHER_REDIS_PORT || process.env.REDIS_PORT,
    db: process.env.PUBLISHER_DATABASE || process.env.REDIS_DATABASE,
  },
};

const rawSubscriberConfig = {
  redis: {
    url: process.env.SUBSCRIBER_REDIS_URL || process.env.REDIS_URL,
    host: process.env.SUBSCRIBER_REDIS_HOST || process.env.REDIS_HOST,
    port: process.env.SUBSCRIBER_REDIS_PORT || process.env.REDIS_PORT,
    db: process.env.SUBSCRIBER_DATABASE || process.env.REDIS_DATABASE,
  },
  channels: ['locales-index'],
};

export const publisherConfig = validateConfig('Publisher configuration', publisherConfigSchema, rawPublisherConfig);

export const subscriberConfig = validateConfig('Subscriber configuration', subscriberConfigSchema, rawSubscriberConfig);
