import z from 'zod';

import { validateConfig } from '@intake24/common-backend';

import { redisOptionsWithKeyPrefixSchema } from './redis';

export const queueConfigSchema = z.object({
  redis: redisOptionsWithKeyPrefixSchema,
  workers: z.coerce.number().int().positive().default(3),
});

export type QueueConfig = z.infer<typeof queueConfigSchema>;

const rawQueueConfig = {
  redis: {
    url: process.env.QUEUE_REDIS_URL || process.env.REDIS_URL,
    host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST,
    port: process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT,
    db: process.env.QUEUE_REDIS_DATABASE || process.env.REDIS_DATABASE,
    keyPrefix: process.env.QUEUE_REDIS_PREFIX || 'it24:queue',
  },
  workers: process.env.QUEUE_WORKERS,
};

const parsedQueueConfig = validateConfig('Queue configuration', queueConfigSchema, rawQueueConfig);

export default parsedQueueConfig;
