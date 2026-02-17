import { z } from 'zod';

import { validateConfig } from '../../util';

export const logConfigSchema = z.object({
  level: z.string().default('debug'),
  dir: z.string().default('storage/logs'),
});
export type LogConfig = z.infer<typeof logConfigSchema>;

export const rawLogConfig = {
  level: process.env.LOG_LEVEL,
  dir: process.env.LOG_DIR,
};

export const logConfig = validateConfig('Log configuration', logConfigSchema, rawLogConfig);
export default logConfig;
