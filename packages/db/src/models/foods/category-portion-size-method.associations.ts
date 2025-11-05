import Category from './category';
import CategoryPortionSizeMethod from './category-portion-size-method';

export function setupCategoryPortionSizeMethodAssociations() {
  CategoryPortionSizeMethod.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category',
  });
}
