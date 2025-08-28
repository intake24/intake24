import type {
  CategoryContentsResponse,
  CategoryListEntry,
} from '@intake24/common/types/http/admin';
import type { Category, Food } from '@intake24/db';

import { foodsResponse } from './foods';

export function categoryResponse(category: Category): CategoryListEntry {
  const { id, code, localeId, englishName, name, hidden } = category;

  return { id, code, localeId, englishName, name, hidden };
}

export function categoryContentsResponse({
  categories,
  foods,
}: {
  categories: Category[];
  foods: Food[];
}): CategoryContentsResponse {
  return {
    categories: categories.map(categoryResponse),
    foods: foods.map(foodsResponse),
  };
}
