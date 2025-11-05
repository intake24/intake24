import AssociatedFood from './associated-foods';
import Brand from './brand';
import Category from './category';
import Food from './food';
import FoodAttribute from './food-attribute';
import FoodCategory from './food-category';
import FoodNutrient from './food-nutrient';
import FoodPortionSizeMethod from './food-portion-size-method';
import FoodThumbnailImage from './food-thumbnail-image';
import NutrientTableRecord from './nutrient-table-record';

export function setupFoodAssociations() {
  Food.hasMany(Brand, {
    foreignKey: 'foodId',
    as: 'brands',
  });

  Food.hasMany(AssociatedFood, {
    foreignKey: 'foodId',
    as: 'associatedFoods',
  });

  Food.hasMany(AssociatedFood, {
    foreignKey: 'associatedFoodCode',
    sourceKey: 'code',
    constraints: false,
    as: 'foodAssociations',
  });

  Food.hasOne(FoodAttribute, {
    foreignKey: 'foodId',
    as: 'attributes',
  });

  Food.belongsToMany(NutrientTableRecord, {
    through: FoodNutrient,
    foreignKey: 'foodId',
    otherKey: 'nutrientTableRecordId',
    as: 'nutrientRecords',
  });

  Food.hasMany(FoodNutrient, {
    foreignKey: 'foodId',
    as: 'nutrientMappings',
  });

  Food.belongsToMany(Category, {
    through: FoodCategory,
    foreignKey: 'foodId',
    otherKey: 'categoryId',
    as: 'parentCategories',
  });

  Food.hasMany(FoodCategory, {
    foreignKey: 'foodId',
    as: 'parentCategoryMappings',
  });

  Food.hasMany(FoodPortionSizeMethod, {
    foreignKey: 'foodId',
    as: 'portionSizeMethods',
  });

  Food.hasMany(FoodThumbnailImage, {
    foreignKey: 'foodId',
    as: 'thumbnailImages',
  });
}
