import { z } from 'zod';

export const pkgV2PortionSizeImageLabels = z.object({
  asServed: z.record(z.string(), z.record(z.string(), z.string())),
  guide: z.record(z.string(), z.record(z.string(), z.string())),
  drinkware: z.record(z.string(), z.record(z.string(), z.string())),
});

export type PkgV2PortionSizeImageLabels = z.infer<typeof pkgV2PortionSizeImageLabels>;
