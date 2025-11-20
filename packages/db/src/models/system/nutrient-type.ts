import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SystemNutrientUnit from './nutrient-unit';

@Scopes(() => ({
  unit: { include: [{ model: SystemNutrientUnit }] },
  list: { order: [['id', 'ASC']] },
}))
@Table({
  modelName: 'NutrientType',
  tableName: 'nutrient_types',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SystemNutrientType extends BaseModel<
  InferAttributes<SystemNutrientType>,
  InferCreationAttributes<SystemNutrientType>
> {
  @Column({
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  @ForeignKey(() => SystemNutrientUnit)
  declare unitId: string;

  @BelongsTo(() => SystemNutrientUnit, 'unitId')
  declare unit?: NonAttribute<SystemNutrientUnit>;
}

export type SystemNutrientTypeAttributes = Attributes<SystemNutrientType>;
export type SystemNutrientTypeCreationAttributes = CreationAttributes<SystemNutrientType>;
