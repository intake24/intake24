import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type NutrientTable from './nutrient-table';

import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'NutrientTableCsvMappingField',
  tableName: 'nutrient_table_csv_mapping_fields',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientTableCsvMappingField extends BaseModel<
  InferAttributes<NutrientTableCsvMappingField>,
  InferCreationAttributes<NutrientTableCsvMappingField>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare nutrientTableId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare fieldName: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare columnOffset: number;

  declare nutrientTable?: NonAttribute<NutrientTable>;
}

export type NutrientTableCsvMappingFieldAttributes = Attributes<NutrientTableCsvMappingField>;
export type NutrientTableCsvMappingFieldCreationAttributes = CreationAttributes<NutrientTableCsvMappingField>;
