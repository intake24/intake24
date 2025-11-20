import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import Category from './category';
import Food from './food';

@Table({
  timestamps: false,
  underscored: true,
  freezeTableName: true,
  tableName: 'foods_categories',
})
export default class FoodCategory extends BaseModel<
  InferAttributes<FoodCategory>,
  InferCreationAttributes<FoodCategory>
> {
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare foodId: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare categoryId: string;

  @BelongsTo(() => Food, 'foodId')
  declare food?: NonAttribute<Food>;

  @BelongsTo(() => Category, 'categoryId')
  declare category?: NonAttribute<Category>;
}

export type FoodCategoryAttributes = Attributes<FoodCategory>;
export type FoodCategoryCreationAttributes = CreationAttributes<FoodCategory>;
