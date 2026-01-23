import { z } from 'zod';

import { portionSizeMethodBase, portionSizeMethods, portionSizeParameter } from '@intake24/common/surveys/portion-size';

export const portionSizeMethodAttributes = portionSizeMethodBase.extend({
  id: z.string(),
  method: z.enum(portionSizeMethods),
  parameters: portionSizeParameter,
});
export type PortionSizeMethodAttributes = z.infer<typeof portionSizeMethodAttributes>;

export const categoryPortionSizeMethodAttributes = portionSizeMethodAttributes.extend({
  categoryId: z.string(),
});
export type CategoryPortionSizeMethodAttributes = z.infer<typeof categoryPortionSizeMethodAttributes>;
export const foodPortionSizeMethodAttributes = portionSizeMethodAttributes.extend({
  foodId: z.string(),
});
export type FoodPortionSizeMethodAttributes = z.infer<typeof foodPortionSizeMethodAttributes>;
