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
import FoodsNutrientType from './nutrient-type';

@Table({
  modelName: 'NutrientTypeInKcal',
  tableName: 'nutrient_type_in_kcal',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientTypeInKcal extends BaseModel<
  InferAttributes<NutrientTypeInKcal>,
  InferCreationAttributes<NutrientTypeInKcal>
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
  declare nutrientTypeId: string;

  @Column({
    allowNull: false,
    type: DataType.DOUBLE,
  })
  declare kcalPerUnit: number;

  @BelongsTo(() => FoodsNutrientType, 'nutrientTypeId')
  declare nutrient?: NonAttribute<FoodsNutrientType>;
}

export type NutrientTypeInKcalAttributes = Attributes<NutrientTypeInKcal>;
export type NutrientTypeInKcalCreationAttributes = CreationAttributes<NutrientTypeInKcal>;
