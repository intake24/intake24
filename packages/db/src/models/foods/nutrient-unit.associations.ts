import FoodsNutrientType from './nutrient-type';
import NutrientUnit from './nutrient-unit';

export function setupNutrientUnitAssociations() {
  NutrientUnit.hasMany(FoodsNutrientType, { foreignKey: 'unitId' });
}
