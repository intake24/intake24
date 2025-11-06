import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type NutrientTable from './nutrient-table';

import type FoodsNutrientType from './nutrient-type';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

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

  declare nutrientTable?: NonAttribute<NutrientTable>;

  declare nutrientType?: NonAttribute<FoodsNutrientType>;
}

export type NutrientTableCsvMappingNutrientAttributes = Attributes<NutrientTableCsvMappingNutrient>;
export type NutrientTableCsvMappingNutrientCreationAttributes
  = CreationAttributes<NutrientTableCsvMappingNutrient>;
