import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import NutrientTableRecord from './nutrient-table-record';
import FoodsNutrientType from './nutrient-type';

;

@Table({
  modelName: 'NutrientTableRecordNutrient',
  tableName: 'nutrient_table_record_nutrients',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientTableRecordNutrient extends BaseModel<
  InferAttributes<NutrientTableRecordNutrient>,
  InferCreationAttributes<NutrientTableRecordNutrient>
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
  declare nutrientTableRecordId: ForeignKey<NutrientTableRecord['id']>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare nutrientTypeId: ForeignKey<FoodsNutrientType['id']>;

  @Column({
    allowNull: false,
    field: 'units_per_100g',
    type: DataType.DOUBLE,
  })
  declare unitsPer100g: number;

  @BelongsTo(() => FoodsNutrientType, 'nutrientTypeId')
  declare nutrientType?: NonAttribute<FoodsNutrientType>;

  @BelongsTo(() => NutrientTableRecord, 'nutrientTableRecordId')
  declare record?: NonAttribute<NutrientTableRecord>;
}

export type NutrientTableRecordNutrientAttributes = Attributes<NutrientTableRecordNutrient>;
export type NutrientTableRecordNutrientCreationAttributes
  = CreationAttributes<NutrientTableRecordNutrient>;
