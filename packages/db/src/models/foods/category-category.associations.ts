import Category from './category';
import CategoryCategory from './category-category';

export function setupCategoryCategoryAssociations() {
  CategoryCategory.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category',
  });

  CategoryCategory.belongsTo(Category, {
    foreignKey: 'subCategoryId',
    as: 'subCategory',
  });
}
