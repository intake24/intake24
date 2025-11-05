import AssociatedFood from './associated-foods';
import Category from './category';
import CategoryAttribute from './category-attributes';
import CategoryCategory from './category-category';
import CategoryPortionSizeMethod from './category-portion-size-method';
import Food from './food';
import FoodCategory from './food-category';
import FoodsLocale from './locale';

export function setupCategoryAssociations() {
  Category.hasMany(AssociatedFood, {
    foreignKey: 'associatedCategoryCode',
    sourceKey: 'code',
    constraints: false,
    as: 'categoryAssociations',
  });

  Category.belongsTo(FoodsLocale, {
    foreignKey: 'localeId',
    as: 'locale',
  });

  Category.hasOne(CategoryAttribute, {
    foreignKey: 'categoryId',
    as: 'attributes',
  });

  Category.belongsToMany(Category, {
    through: CategoryCategory,
    foreignKey: 'subCategoryId',
    otherKey: 'categoryId',
    as: 'parentCategories',
  });

  Category.belongsToMany(Category, {
    through: CategoryCategory,
    foreignKey: 'categoryId',
    otherKey: 'subCategoryId',
    as: 'subCategories',
  });

  Category.hasMany(CategoryCategory, {
    foreignKey: 'subCategoryId',
    as: 'parentCategoryMappings',
  });

  Category.hasMany(CategoryCategory, {
    foreignKey: 'categoryId',
    as: 'subcategoryMappings',
  });

  Category.hasMany(CategoryPortionSizeMethod, {
    foreignKey: 'categoryId',
    as: 'portionSizeMethods',
  });

  Category.belongsToMany(Food, {
    through: FoodCategory,
    foreignKey: 'categoryId',
    otherKey: 'foodId',
    as: 'foods',
  });

  Category.hasMany(FoodCategory, {
    foreignKey: 'categoryId',
    as: 'foodLinks',
  });
}
