import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import NutrientTable from './nutrient-table';

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

  @BelongsTo(() => NutrientTable, {
    foreignKey: 'nutrientTableId',
    onUpdate: 'cascade',
    onDelete: 'cascade',
  })
  declare nutrientTable?: NonAttribute<NutrientTable>;
}

export type NutrientTableCsvMappingFieldAttributes = Attributes<NutrientTableCsvMappingField>;
export type NutrientTableCsvMappingFieldCreationAttributes
  = CreationAttributes<NutrientTableCsvMappingField>;
