import NutrientTable from './nutrient-table';
import NutrientTableCsvMappingField from './nutrient-table-csv-mapping-field';

export function setupNutrientTableCsvMappingFieldAssociations() {
  NutrientTableCsvMappingField.belongsTo(NutrientTable, {
    foreignKey: 'nutrientTableId',
    onUpdate: 'cascade',
    onDelete: 'cascade',
  });
}
