import NutrientTable from './nutrient-table';
import NutrientTableCsvMapping from './nutrient-table-csv-mapping';
import NutrientTableCsvMappingField from './nutrient-table-csv-mapping-field';
import NutrientTableCsvMappingNutrient from './nutrient-table-csv-mapping-nutrient';
import NutrientTableRecord from './nutrient-table-record';

export function setupNutrientTableAssociations() {
  NutrientTable.hasMany(NutrientTableRecord, { foreignKey: 'nutrientTableId' });
  NutrientTable.hasOne(NutrientTableCsvMapping, { foreignKey: 'nutrientTableId' });
  NutrientTable.hasMany(NutrientTableCsvMappingField, { foreignKey: 'nutrientTableId' });
  NutrientTable.hasMany(NutrientTableCsvMappingNutrient, { foreignKey: 'nutrientTableId' });
}
