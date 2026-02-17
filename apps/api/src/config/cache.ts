import z from 'zod';

import { validateConfig } from '@intake24/common-backend';

import { msStringValue } from './common';
import { redisOptionsWithKeyPrefixSchema } from './redis';

export const cacheConfigSchema = z.object({
  redis: redisOptionsWithKeyPrefixSchema,
  ttl: msStringValue,
  surveySettingsTTL: msStringValue,
});

export type CacheConfig = z.infer<typeof cacheConfigSchema>;

const rawCacheConfig = {
  redis: {
    url: process.env.CACHE_REDIS_URL || process.env.REDIS_URL,
    host: process.env.CACHE_REDIS_HOST || process.env.REDIS_HOST,
    port: process.env.CACHE_REDIS_PORT || process.env.REDIS_PORT,
    db: process.env.CACHE_REDIS_DATABASE || process.env.REDIS_DATABASE,
    keyPrefix: process.env.CACHE_REDIS_PREFIX || 'it24:cache:',
  },
  ttl: process.env.CACHE_TTL || '7d',
  surveySettingsTTL: process.env.CACHE_SURVEY_SETTINGS_TTL || '120s',
};

const parsedCacheConfig = validateConfig('Cache configuration', cacheConfigSchema, rawCacheConfig);

export default parsedCacheConfig;
