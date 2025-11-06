import type {
  Attributes,
  CreationAttributes,
  ForeignKey as ForeignKeyBrand,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type Food from './food';

import type NutrientTableRecord from './nutrient-table-record';
import {
  Column,
  DataType,
  Table,
} from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'FoodNutrient',
  tableName: 'foods_nutrients',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class FoodNutrient extends BaseModel<
  InferAttributes<FoodNutrient>,
  InferCreationAttributes<FoodNutrient>
> {
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare foodId: ForeignKeyBrand<Food['id']>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare nutrientTableRecordId: ForeignKeyBrand<NutrientTableRecord['id']>;

  declare food?: NonAttribute<Food>;

  declare nutrientTableRecord?: NonAttribute<NutrientTableRecord>;
}

export type FoodNutrientAttributes = Attributes<FoodNutrient>;
export type FoodNutrientCreationAttributes = CreationAttributes<FoodNutrient>;
