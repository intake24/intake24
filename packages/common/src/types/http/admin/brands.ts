import { z } from 'zod';

export const brandAttributes = z.object({
  id: z.string(),
  foodId: z.string(),
  name: z.string(),
});
export type BrandAttributes = z.infer<typeof brandAttributes>;
