import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import { Category } from '@intake24/db';

import BaseModel from '../model';

@Table({
  modelName: 'CategoryCategory',
  tableName: 'categories_categories',
  timestamps: false,
  underscored: true,
  freezeTableName: true,
})
export default class CategoryCategory extends BaseModel<
  InferAttributes<CategoryCategory>,
  InferCreationAttributes<CategoryCategory>
> {
  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare subcategoryCode: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare categoryCode: string;

  @BelongsTo(() => Category, 'subcategoryCode')
  declare subcategory?: NonAttribute<Category>;

  @BelongsTo(() => Category, 'categoryCode')
  declare category?: NonAttribute<Category>;
}

export type CategoryCategoryAttributes = Attributes<CategoryCategory>;
export type CategoryCategoryCreationAttributes = CreationAttributes<CategoryCategory>;
