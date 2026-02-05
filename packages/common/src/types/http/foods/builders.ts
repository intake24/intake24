import { z } from 'zod';

import { foodBuilderAttributes } from '../admin';

export const foodBuilder = foodBuilderAttributes.pick({
  code: true,
  localeId: true,
  type: true,
  name: true,
  triggerWord: true,
  steps: true,
}).extend({
  synonyms: z.object({ synonyms: z.string() }).optional(),
});
export type FoodBuilder = z.infer<typeof foodBuilder>;

export const foodBuilderHeader = foodBuilderAttributes.pick({
  id: true,
  code: true,
  name: true,
  triggerWord: true,
}).extend({
  description: z.string(),
  synonyms: z.set(z.string()),
});
export type FoodBuilderHeader = z.infer<typeof foodBuilderHeader>;
