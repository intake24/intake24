import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import type { UseInRecipeType } from '@intake24/common/types';

import BaseModel from '../model';
import Food from './food';

@Table({
  modelName: 'FoodAttribute',
  tableName: 'food_attributes',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class FoodAttribute extends BaseModel<
  InferAttributes<FoodAttribute>,
  InferCreationAttributes<FoodAttribute>
> {
  @Column({
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare foodId: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
  })
  declare sameAsBeforeOption: CreationOptional<boolean | null>;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
  })
  declare readyMealOption: CreationOptional<boolean | null>;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare reasonableAmount: CreationOptional<number | null>;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare useInRecipes: CreationOptional<UseInRecipeType | null>;

  @BelongsTo(() => Food, 'foodId')
  declare food?: NonAttribute<Food>;
}

export type FoodAttributeAttributes = Attributes<FoodAttribute>;
export type FoodAttributeCreationAttributes = CreationAttributes<FoodAttribute>;
