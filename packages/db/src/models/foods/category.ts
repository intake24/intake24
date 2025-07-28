import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsToMany, Column, DataType, HasMany, HasOne, Table } from 'sequelize-typescript';

import {
  AssociatedFood,
  CategoryAttribute,
  CategoryCategory,
  CategoryLocal,
  Food,
  FoodCategory,
} from '.';
import BaseModel from '../model';

@Table({
  modelName: 'Category',
  tableName: 'categories',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class Category extends BaseModel<
  InferAttributes<Category>,
  InferCreationAttributes<Category>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(32),
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  declare isHidden: CreationOptional<boolean>;

  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  declare version: string;

  @HasOne(() => CategoryAttribute)
  declare attributes?: NonAttribute<CategoryAttribute>;

  @HasMany(() => AssociatedFood, 'associatedCategoryCode')
  declare categoryAssociations?: NonAttribute<AssociatedFood[]>;

  @BelongsToMany(() => Category, () => CategoryCategory, 'subcategoryCode', 'categoryCode')
  declare parentCategories?: NonAttribute<Category[]>;

  @HasMany(() => CategoryCategory, 'subcategoryCode')
  declare parentCategoryMappings?: NonAttribute<CategoryCategory[]>;

  @BelongsToMany(() => Category, () => CategoryCategory, 'categoryCode', 'subcategoryCode')
  declare subCategories?: NonAttribute<Category[]>;

  @HasMany(() => CategoryCategory, 'categoryCode')
  declare subcategoryMappings?: NonAttribute<CategoryCategory[]>;

  @BelongsToMany(() => Food, () => FoodCategory)
  declare foods?: NonAttribute<Food[]>;

  @HasMany(() => FoodCategory, 'categoryCode')
  declare foodLinks?: NonAttribute<CategoryCategory[]>;

  @HasMany(() => CategoryLocal, 'categoryCode')
  declare locals?: NonAttribute<CategoryLocal[]>;

  @HasMany(() => CategoryLocal, 'categoryCode')
  declare prototypeLocals?: NonAttribute<CategoryLocal[]>;
}

export type CategoryAttributes = Attributes<Category>;
export type CategoryCreationAttributes = CreationAttributes<Category>;
