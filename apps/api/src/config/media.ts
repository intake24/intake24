import { z } from 'zod';
import { validateConfig } from './validate-config';

export const baseProvider = z.object({
  public: z.string(),
  private: z.string(),
});
export type BaseProvider = z.infer<typeof baseProvider>;
export type MediaDisk = keyof BaseProvider;

const mediaConfigSchema = z.object({
  storage: z.object({
    provider: z.enum(['local'/* , 's3', 'gcs' */]).default('local'),
    local: baseProvider.extend({
      public: z.string().default('storage/public/media'),
      private: z.string().default('storage/private/media'),
    }),
  }),
  conversions: z.object({
    sm: z.object({
      width: z.number().default(300),
    }),
    md: z.object({
      width: z.number().default(600),
    }),
    lg: z.object({
      width: z.number().default(900),
    }),
    xl: z.object({
      width: z.number().default(1200),
    }),
  }),
});
export type MediaConfig = z.infer<typeof mediaConfigSchema>;
export type MediaProvider = MediaConfig['storage']['provider'];
export type MediaConversion = keyof MediaConfig['conversions'];

const parsedMediaConfig = validateConfig('Media configuration', mediaConfigSchema, {
  storage: {
    provider: process.env.MEDIA_PROVIDER,
    local: {
      public: process.env.MEDIA_PUBLIC,
      private: process.env.MEDIA_PRIVATE,
    },
  },
  conversions: {
    sm: { width: 300 },
    md: { width: 600 },
    lg: { width: 900 },
    xl: { width: 1200 },
  },
});

export default parsedMediaConfig;
