import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SystemNutrientType from './nutrient-type';

@Scopes(() => ({
  nutrientTypes: { include: [{ model: SystemNutrientType }] },
}))
@Table({
  modelName: 'NutrientUnit',
  tableName: 'nutrient_units',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SystemNutrientUnit extends BaseModel<
  InferAttributes<SystemNutrientUnit>,
  InferCreationAttributes<SystemNutrientUnit>
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

  @HasMany(() => SystemNutrientType, 'unitId')
  declare nutrientTypes?: NonAttribute<SystemNutrientType[]>;
}

export type SystemNutrientUnitAttributes = Attributes<SystemNutrientUnit>;
export type SystemNutrientUnitCreationAttributes = CreationAttributes<SystemNutrientUnit>;
