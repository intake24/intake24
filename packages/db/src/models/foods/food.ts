import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  HasOne,
  Scopes,
  Table,
} from 'sequelize-typescript';

import {
  AssociatedFood,
  Brand,
  Category,
  FoodAttribute,
  FoodCategory,
  FoodLocal,
  FoodLocalList,
} from '.';
import BaseModel from '../model';
import FoodsLocale from './locale';

@Scopes(() => ({
  attributes: { include: [{ model: FoodAttribute }] },
  locals: { include: [{ model: FoodLocal, as: 'locals' }] },
  brand: { include: [{ model: Brand }] },
}))
@Table({
  modelName: 'Food',
  tableName: 'foods',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class Food extends BaseModel<InferAttributes<Food>, InferCreationAttributes<Food>> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(8),
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  declare version: string;

  @HasOne(() => FoodAttribute, 'foodCode')
  declare attributes?: NonAttribute<FoodAttribute>;

  @HasMany(() => AssociatedFood, 'foodCode')
  declare associatedFoods?: NonAttribute<AssociatedFood[]>;

  @HasMany(() => Brand, 'foodCode')
  declare brands?: NonAttribute<Brand[]>;

  @BelongsToMany(() => Category, () => FoodCategory)
  declare parentCategories?: NonAttribute<Category[]>;

  @BelongsToMany(() => FoodsLocale, () => FoodLocalList, 'foodCode', 'localeId')
  declare locales?: NonAttribute<FoodsLocale[]>;

  @HasMany(() => FoodCategory, 'foodCode')
  declare parentCategoryMappings?: NonAttribute<FoodCategory[]>;

  @HasMany(() => AssociatedFood, 'associatedFoodCode')
  declare foodAssociations?: NonAttribute<AssociatedFood[]>;

  @HasMany(() => FoodLocal, 'foodCode')
  declare locals?: NonAttribute<FoodLocal[]>;

  @HasMany(() => FoodLocal, 'foodCode')
  declare prototypeLocals?: NonAttribute<FoodLocal[]>;
}

export type FoodAttributes = Attributes<Food>;
export type FoodCreationAttributes = CreationAttributes<Food>;
