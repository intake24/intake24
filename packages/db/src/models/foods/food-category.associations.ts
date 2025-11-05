import Category from './category';
import Food from './food';
import FoodCategory from './food-category';

export function setupFoodCategoryAssociations() {
  FoodCategory.belongsTo(Food, {
    foreignKey: 'foodId',
    as: 'food',
  });

  FoodCategory.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category',
  });
}
