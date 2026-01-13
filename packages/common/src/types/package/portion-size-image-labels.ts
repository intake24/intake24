import { z } from 'zod';

export const pkgV2PortionSizeImageLabels = z.object({
  asServed: z.record(z.record(z.string())),
  guide: z.record(z.record(z.string())),
  drinkware: z.record(z.record(z.string())),
});

export type PkgV2PortionSizeImageLabels = z.infer<typeof pkgV2PortionSizeImageLabels>;
