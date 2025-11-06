import NutrientTableRecordNutrient from './nutrient-table-record-nutrient';
import NutrientType from './nutrient-type';
import NutrientTypeInKcal from './nutrient-type-in-kcal';
import FoodsNutrientUnit from './nutrient-unit';

export function setupNutrientTypeAssociations() {
  NutrientType.addScope('unit', { include: [{ model: FoodsNutrientUnit }] });
  NutrientType.addScope('inKcal', { include: [{ model: NutrientTypeInKcal }] });
  NutrientType.addScope('list', { order: [['id', 'ASC']] });
  NutrientType.belongsTo(FoodsNutrientUnit, { foreignKey: 'unitId' });
  NutrientType.hasOne(NutrientTypeInKcal, { foreignKey: 'nutrientTypeId' });
  NutrientType.hasOne(NutrientTableRecordNutrient, { foreignKey: 'nutrientTypeId' });
}
