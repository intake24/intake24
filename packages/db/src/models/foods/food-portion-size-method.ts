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
import type { PortionSizeMethodId, PortionSizeParameter } from '@intake24/common/surveys';

import BaseModel from '../model';
import Food from './food';

@Table({
  modelName: 'FoodPortionSizeMethod',
  tableName: 'food_portion_size_methods',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class FoodPortionSizeMethod extends BaseModel<
  InferAttributes<FoodPortionSizeMethod>,
  InferCreationAttributes<FoodPortionSizeMethod>
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
  declare foodId: ForeignKey<Food['id']>;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare method: PortionSizeMethodId;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare useForRecipes: boolean;

  @Column({
    allowNull: false,
    type: DataType.FLOAT(17),
  })
  declare conversionFactor: number;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare orderBy: string;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare parameters: PortionSizeParameter;

  @BelongsTo(() => Food, 'foodId')
  declare food?: NonAttribute<Food>;
}

export type FoodPortionSizeMethodAttributes = Attributes<FoodPortionSizeMethod>;
export type FoodPortionSizeMethodCreationAttributes = CreationAttributes<FoodPortionSizeMethod>;
