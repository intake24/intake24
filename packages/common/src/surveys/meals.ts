import { z } from 'zod';
import { requiredLocaleTranslationWithLimit } from '../types/common';

export const meal = z.object({
  name: requiredLocaleTranslationWithLimit({ max: 64 }),
  time: z.string().regex(/^\d{1,2}:\d{2}$/),
  flags: z.array(z.string()),
});

export type Meal = z.infer<typeof meal>;
