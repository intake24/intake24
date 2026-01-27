import z from 'zod';

import { redisOptionsSchema } from './redis';
import { validateConfig } from './validate-config';

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
    url: process.env.PUBLISHER_REDIS_URL || process.env.REDIS_URL || undefined,
    host: process.env.PUBLISHER_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.PUBLISHER_REDIS_PORT || process.env.REDIS_PORT || '6379', 10),
    db: Number.parseInt(process.env.PUBLISHER_DATABASE || process.env.REDIS_DATABASE || '0', 10),
  },
};

const rawSubscriberConfig = {
  redis: {
    url: process.env.SUBSCRIBER_REDIS_URL || process.env.REDIS_URL || undefined,
    host: process.env.SUBSCRIBER_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.SUBSCRIBER_REDIS_PORT || process.env.REDIS_PORT || '6379', 10),
    db: Number.parseInt(process.env.SUBSCRIBER_DATABASE || process.env.REDIS_DATABASE || '0', 10),
  },
  channels: ['locales-index'],
};

export const publisherConfig = validateConfig('Publisher configuration', publisherConfigSchema, rawPublisherConfig);

export const subscriberConfig = validateConfig('Subscriber configuration', subscriberConfigSchema, rawSubscriberConfig);
