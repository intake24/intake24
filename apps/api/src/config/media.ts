import { z } from 'zod';

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
    thumb: z.object({
      width: z.number().default(300),
    }),
    medium: z.object({
      width: z.number().default(600),
    }),
    large: z.object({
      width: z.number().default(800),
    }),
    xLarge: z.object({
      width: z.number().default(1200),
    }),
  }),
});
export type MediaConfig = z.infer<typeof mediaConfigSchema>;
export type MediaProvider = MediaConfig['storage']['provider'];
export type MediaConversion = keyof MediaConfig['conversions'];

export default mediaConfigSchema.parse({
  storage: {
    provider: process.env.MEDIA_PROVIDER,
    local: {
      public: process.env.MEDIA_PUBLIC,
      private: process.env.MEDIA_PRIVATE,
    },
  },
  conversions: {
    thumb: { width: 300 },
    medium: { width: 600 },
    large: { width: 800 },
    xLarge: { width: 1200 },
  },
});
