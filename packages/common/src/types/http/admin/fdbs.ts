import { z } from 'zod';

import { categoryListEntry } from './categories';
import { foodListEntry } from './foods';
import { nutrientTableAttributes } from './nutrient-tables';

export const foodDatabaseRefs = z.object({
  nutrientTables: nutrientTableAttributes.array(),
});

export type FoodDatabaseRefs = z.infer<typeof foodDatabaseRefs>;

export const categoryContentsResponse = z.object({
  categories: categoryListEntry.array(),
  foods: foodListEntry.array(),
});
export type CategoryContentsResponse = z.infer<typeof categoryContentsResponse>;
