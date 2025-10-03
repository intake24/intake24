import { z } from 'zod';

export const inheritableAttributes = z.object({
  readyMealOption: z.boolean().nullish(),
  sameAsBeforeOption: z.boolean().nullish(),
  reasonableAmount: z.number().nullish(),
  useInRecipes: z.union([z.literal(0), z.literal(1), z.literal(2)]).nullish(),
});
export type InheritableAttributes = z.infer<typeof inheritableAttributes>;
