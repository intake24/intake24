import { z } from 'zod';

import { portionSizeMethods } from '@intake24/common/surveys/portion-size';

export const portionSizeMethodAttributes = z.object({
  id: z.string(),
  categoryId: z.string(),
  method: z.enum(portionSizeMethods),
  description: z.string().min(1).max(256),
  useForRecipes: z.boolean(),
  conversionFactor: z.number(),
  orderBy: z.string(),
  parameters: z.object({}),
});
export type PortionSizeMethodAttributes = z.infer<typeof portionSizeMethodAttributes>;
