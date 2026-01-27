import type { RedisOptions as BaseRedisOptions } from 'ioredis';

import z from 'zod';

export const redisOptionsSchema = z.object({
  url: z.string().optional(),
  path: z.string().optional(),
  keyPrefix: z.string().optional(),
  host: z.string().nonempty(),
  port: z.coerce.number().int().positive(),
  db: z.coerce.number().int().nonnegative(),
});

export type RedisOptions = z.infer<typeof redisOptionsSchema>;

export const redisOptionsWithKeyPrefixSchema = redisOptionsSchema.extend({
  keyPrefix: z.string().nonempty(),
});

export type RedisOptionsWithKeyPrefix = z.infer<typeof redisOptionsWithKeyPrefixSchema>;

type AssertAssignable<_A extends B, B> = true;

type _RedisOptionsCheck = AssertAssignable<RedisOptionsWithKeyPrefix, BaseRedisOptions>;
