import type { AssociatedFoodCreationAttributes } from '@intake24/db';

export type AssociatedFoodItem = AssociatedFoodCreationAttributes;

export function createDefaultAssociatedFood(foodId: string): Omit<AssociatedFoodItem, 'id'> {
  return {
    foodId,
    genericName: { en: '' },
    text: { en: '' },
    linkAsMain: false,
    multiple: false,
    orderBy: '0',
  };
}
