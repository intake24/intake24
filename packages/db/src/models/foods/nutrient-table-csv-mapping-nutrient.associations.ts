import NutrientTable from './nutrient-table';
import NutrientTableCsvMappingNutrient from './nutrient-table-csv-mapping-nutrient';
import FoodsNutrientType from './nutrient-type';

export function setupNutrientTableCsvMappingNutrientAssociations() {
  NutrientTableCsvMappingNutrient.belongsTo(NutrientTable, {
    foreignKey: 'nutrientTableId',
    onUpdate: 'cascade',
    onDelete: 'cascade',
  });
  NutrientTableCsvMappingNutrient.belongsTo(FoodsNutrientType, { foreignKey: 'nutrientTypeId' });
}
