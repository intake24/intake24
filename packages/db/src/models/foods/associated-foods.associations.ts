import AssociatedFood from './associated-foods';
import Category from './category';
import Food from './food';

export function setupAssociatedFoodsAssociations() {
  AssociatedFood.belongsTo(Category, {
    foreignKey: 'associatedCategoryCode',
    targetKey: 'code',
    constraints: false,
    as: 'associatedCategory',
  });

  AssociatedFood.belongsTo(Food, {
    foreignKey: 'foodId',
    as: 'food',
  });

  AssociatedFood.belongsTo(Food, {
    foreignKey: 'associatedFoodCode',
    targetKey: 'code',
    constraints: false,
    as: 'associatedFood',
  });
}
