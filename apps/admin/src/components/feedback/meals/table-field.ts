import type { MealTableField, MealTableFieldType } from '@intake24/common/feedback';

import { copy } from '@intake24/common/util';

export const tableFieldDefaults: Record<MealTableFieldType, MealTableField> = {
  standard: {
    type: 'standard',
    fieldId: 'name',
    header: { en: 'Meal' },
    value: { en: '{value}' },
  },
  custom: {
    type: 'custom',
    fieldId: 'meal-prompt-id',
    header: { en: 'Meal prompt name' },
    value: { en: '{value}' },
  },
  nutrient: {
    type: 'nutrient',
    fieldId: 'nutrient-1',
    header: { en: 'Energy (kcal)' },
    value: { en: '{value}' },
    types: ['1'],
  },
};

export function getTableFieldDefaults(type: MealTableFieldType): MealTableField {
  return copy(tableFieldDefaults[type]);
}
