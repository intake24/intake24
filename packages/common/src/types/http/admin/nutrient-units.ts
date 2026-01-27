import type { SystemNutrientUnitAttributes } from '@intake24/db';

import { z } from 'zod';

export const nutrientUnitAttributes = z.object({
  id: z.string(),
  description: z.string(),
  symbol: z.string(),
});

export type NutrientUnitAttributes = z.infer<typeof nutrientUnitAttributes>;

export const nutrientUnitRequest = z.object({
  id: z.coerce.number().transform(String),
  description: z.string().max(512),
  symbol: z.string().max(32),
});

export type NutrientUnitRequest = SystemNutrientUnitAttributes;
