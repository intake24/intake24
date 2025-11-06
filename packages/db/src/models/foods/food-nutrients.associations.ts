import Food from './food';
import FoodNutrient from './food-nutrient';
import NutrientTableRecord from './nutrient-table-record';

export function setupFoodNutrientAssociations() {
  FoodNutrient.belongsTo(Food, {
    foreignKey: 'foodId',
    as: 'food',
  });

  FoodNutrient.belongsTo(NutrientTableRecord, {
    foreignKey: 'nutrientTableRecordId',
    as: 'nutrientTableRecord',
  });
}
