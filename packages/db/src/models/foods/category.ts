import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type AssociatedFood from './associated-foods';

import type CategoryAttribute from './category-attributes';
import type CategoryCategory from './category-category';
import type CategoryPortionSizeMethod from './category-portion-size-method';
import type Food from './food';
import type FoodCategory from './food-category';
import type FoodsLocale from './locale';
import {
  Column,
  DataType,
  Table,
} from 'sequelize-typescript';
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
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare simpleName: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare englishName: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare hidden: boolean;

  @Column({
    allowNull: false,
    defaultValue: '[]',
    type: DataType.STRING(2048),
    get(): string[] {
      const val = this.getDataValue('tags') as unknown;
      return val ? JSON.parse(val as string) : [];
    },
    set(value: string[]) {
      this.setDataValue('tags', JSON.stringify(value ?? []));
    },
  })
  declare tags: CreationOptional<string[]>;

  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  declare version: string;

  declare attributes?: NonAttribute<CategoryAttribute>;

  declare locale?: NonAttribute<FoodsLocale>;

  declare categoryAssociations?: NonAttribute<AssociatedFood[]>;

  declare parentCategories?: NonAttribute<Category[]>;

  declare parentCategoryMappings?: NonAttribute<CategoryCategory[]>;

  declare subCategories?: NonAttribute<Category[]>;

  declare subcategoryMappings?: NonAttribute<CategoryCategory[]>;

  declare foods?: NonAttribute<Food[]>;

  declare foodLinks?: NonAttribute<FoodCategory[]>;

  declare portionSizeMethods?: NonAttribute<CategoryPortionSizeMethod[]>;
}

export type CategoryAttributes = Attributes<Category>;
export type CategoryCreationAttributes = CreationAttributes<Category>;
