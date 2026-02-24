import { z } from 'zod';

import { portionSizeMethodBase, portionSizeMethods, portionSizeParameter } from '@intake24/common/surveys/portion-size';

export const portionSizeMethodAttributes = portionSizeMethodBase.extend({
  method: z.enum(portionSizeMethods),
  parameters: portionSizeParameter,
});
export type PortionSizeMethodAttributes = z.infer<typeof portionSizeMethodAttributes>;

export const categoryPortionSizeMethodAttributes = portionSizeMethodAttributes.extend({
  id: z.string(),
  categoryId: z.string(),
});
export type CategoryPortionSizeMethodAttributes = z.infer<typeof categoryPortionSizeMethodAttributes>;
export const foodPortionSizeMethodAttributes = portionSizeMethodAttributes.extend({
  id: z.string(),
  foodId: z.string(),
});
export type FoodPortionSizeMethodAttributes = z.infer<typeof foodPortionSizeMethodAttributes>;
