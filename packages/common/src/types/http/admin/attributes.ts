import { z } from 'zod';

export const inheritableAttributes = z.object({
  readyMealOption: z.boolean().nullish(),
  sameAsBeforeOption: z.boolean().nullish(),
  reasonableAmount: z.number().nullish(),
  useInRecipes: z.literal([0, 1, 2]).nullish(),
});
export type InheritableAttributes = z.infer<typeof inheritableAttributes>;

export const resolvedInheritableAttributes = z.object({
  readyMealOption: z.boolean(),
  sameAsBeforeOption: z.boolean(),
  reasonableAmount: z.number(),
  useInRecipes: z.literal([0, 1, 2]),
});
export type ResolvedInheritableAttributes = z.infer<typeof resolvedInheritableAttributes>;
