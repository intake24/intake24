import type { FoodListEntry } from '@intake24/common/types/http/admin';
import type { Food } from '@intake24/db';

export function foodsResponse(food: Food): FoodListEntry {
  const { id, code, localeId, englishName, name } = food;

  return { id, code, localeId, name: name ?? englishName, englishName };
}
