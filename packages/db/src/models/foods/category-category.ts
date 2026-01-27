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
    type: DataType.BIGINT,
  })
  declare categoryId: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare subCategoryId: string;

  @BelongsTo(() => Category, 'categoryId')
  declare category?: NonAttribute<Category>;

  @BelongsTo(() => Category, 'subCategoryId')
  declare subCategory?: NonAttribute<Category>;
}

export type CategoryCategoryAttributes = Attributes<CategoryCategory>;
export type CategoryCategoryCreationAttributes = CreationAttributes<CategoryCategory>;
