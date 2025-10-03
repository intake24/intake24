import type { AssociatedFoodAttributes } from '@intake24/common/types/http/admin';

export type AssociatedFoodItem = AssociatedFoodAttributes;

export function createDefaultAssociatedFood(foodId: string): Omit<AssociatedFoodItem, 'id'> {
  return {
    foodId,
    associatedFoodCode: null,
    associatedCategoryCode: null,
    genericName: { en: '' },
    text: { en: '' },
    linkAsMain: false,
    multiple: false,
    orderBy: '0',
  };
}
