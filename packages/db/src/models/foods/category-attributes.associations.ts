import Category from './category';
import CategoryAttribute from './category-attributes';

export function setupCategoryAttributeAssociations() {
  CategoryAttribute.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category',
  });

  CategoryAttribute.addScope('category', {
    include: [{ model: Category }],
  });
}
