import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import FoodsNutrientType from './nutrient-type';

@Scopes(() => ({
  nutrientTypes: { include: [{ model: FoodsNutrientType }] },
}))
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

  @HasMany(() => FoodsNutrientType, 'unitId')
  declare nutrientTypes?: NonAttribute<FoodsNutrientType[]>;
}

export type FoodsNutrientUnitAttributes = Attributes<NutrientUnit>;
export type FoodsNutrientUnitCreationAttributes = CreationAttributes<NutrientUnit>;
