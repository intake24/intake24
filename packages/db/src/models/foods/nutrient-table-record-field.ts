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
import NutrientTableRecord from './nutrient-table-record';

@Table({
  modelName: 'NutrientTableRecordField',
  tableName: 'nutrient_table_record_fields',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientTableRecordField extends BaseModel<
  InferAttributes<NutrientTableRecordField>,
  InferCreationAttributes<NutrientTableRecordField>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare nutrientTableRecordId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare value: string;

  @BelongsTo(() => NutrientTableRecord, 'nutrientTableRecordId')
  declare record?: NonAttribute<NutrientTableRecord>;
}

export type NutrientTableRecordFieldAttributes = Attributes<NutrientTableRecordField>;
export type NutrientTableRecordFieldCreationAttributes
  = CreationAttributes<NutrientTableRecordField>;
