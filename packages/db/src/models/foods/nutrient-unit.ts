import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type FoodsNutrientType from './nutrient-type';

import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'NutrientUnit',
  tableName: 'nutrient_units',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientUnit extends BaseModel<
  InferAttributes<NutrientUnit>,
  InferCreationAttributes<NutrientUnit>
> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare symbol: string;

  declare nutrientTypes?: NonAttribute<FoodsNutrientType[]>;
}

export type FoodsNutrientUnitAttributes = Attributes<NutrientUnit>;
export type FoodsNutrientUnitCreationAttributes = CreationAttributes<NutrientUnit>;
