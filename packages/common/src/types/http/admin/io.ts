import { z } from 'zod';

export const packageExportOptions = z.object({
  format: z.enum(['json', 'xlsx']),
  locales: z.array(z.string()).nonempty(),
  options: z.object({
    include: z.array(z.enum(['foods', 'categories', 'associatedFoodPrompts', 'portionSizeMethods', 'asServedImages', 'guideImages'])).nonempty(),
  }),
});

export type PackageExportOptions = z.infer<typeof packageExportOptions>;
