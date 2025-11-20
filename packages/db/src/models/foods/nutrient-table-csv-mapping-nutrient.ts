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
import FoodsNutrientType from './nutrient-type';

@Table({
  modelName: 'NutrientTableCsvMappingNutrient',
  tableName: 'nutrient_table_csv_mapping_nutrients',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientTableCsvMappingNutrient extends BaseModel<
  InferAttributes<NutrientTableCsvMappingNutrient>,
  InferCreationAttributes<NutrientTableCsvMappingNutrient>
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
    type: DataType.BIGINT,
  })
  declare nutrientTypeId: string;

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

  @BelongsTo(() => FoodsNutrientType, 'nutrientTypeId')
  declare nutrientType?: NonAttribute<FoodsNutrientType>;
}

export type NutrientTableCsvMappingNutrientAttributes = Attributes<NutrientTableCsvMappingNutrient>;
export type NutrientTableCsvMappingNutrientCreationAttributes
  = CreationAttributes<NutrientTableCsvMappingNutrient>;
