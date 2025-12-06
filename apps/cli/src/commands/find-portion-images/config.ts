import { z } from 'zod';

export const fpiConfig = z.object({
  locale: z.string(),
  energyValueKcal: z.number(),
  foodFilter: z.string().array(),
  portionSizeFilter: z.string().array(),
  batchSize: z.number(),
  guideImageWidth: z.number(),
});
export type FPIConfig = z.infer<typeof fpiConfig>;
