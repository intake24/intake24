import FoodsNutrientType from './nutrient-type';
import NutrientTypeInKcal from './nutrient-type-in-kcal';

export function setupNutrientTypeInKcalAssociations() {
  NutrientTypeInKcal.belongsTo(FoodsNutrientType, { foreignKey: 'nutrientTypeId' });
}
