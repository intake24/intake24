import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type Category from './category';

import type Food from './food';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

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

  declare food?: NonAttribute<Food>;

  declare category?: NonAttribute<Category>;
}

export type FoodCategoryAttributes = Attributes<FoodCategory>;
export type FoodCategoryCreationAttributes = CreationAttributes<FoodCategory>;
