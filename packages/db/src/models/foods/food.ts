import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { FoodNutrientCreationAttributes } from './food-nutrient';
import type { FoodPortionSizeMethodCreationAttributes } from './food-portion-size-method';
import type { AltNames } from '@intake24/common/types/http/admin';

import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  HasOne,
  Table,
} from 'sequelize-typescript';

import BaseModel from '../model';
import AssociatedFood from './associated-foods';
import Brand from './brand';
import Category from './category';
import FoodAttribute from './food-attribute';
import FoodCategory from './food-category';
import FoodNutrient from './food-nutrient';
import FoodPortionSizeMethod from './food-portion-size-method';
import FoodThumbnailImage from './food-thumbnail-image';
import FoodsLocale from './locale';
import NutrientTableRecord from './nutrient-table-record';

@Table({
  modelName: 'Food',
  tableName: 'foods',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class Food extends BaseModel<
  InferAttributes<Food>,
  InferCreationAttributes<Food> & {
    portionSizeMethods?: FoodPortionSizeMethodCreationAttributes[];
    nutrientMappings?: FoodNutrientCreationAttributes[];
  }
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
    allowNull: true,
    type: DataType.STRING(256),
  })
  declare name: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(256),
  })
  declare simpleName: string | null;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare englishName: string;

  @Column({
    allowNull: false,
    defaultValue: {},
    type: DataType.JSONB,
  })
  declare altNames: CreationOptional<AltNames>;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare tags: CreationOptional<string[]>;

  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  declare version: string;

  @HasMany(() => AssociatedFood, 'foodId')
  declare associatedFoods?: NonAttribute<AssociatedFood[]>;

  @HasOne(() => FoodAttribute, 'foodId')
  declare attributes?: NonAttribute<FoodAttribute>;

  @HasMany(() => Brand, 'foodId')
  declare brands?: NonAttribute<Brand[]>;

  @HasMany(() => AssociatedFood, { foreignKey: 'associatedFoodCode', sourceKey: 'code', constraints: false })
  declare foodAssociations?: NonAttribute<AssociatedFood[]>;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;

  @BelongsToMany(() => NutrientTableRecord, () => FoodNutrient, 'foodId', 'nutrientTableRecordId')
  declare nutrientRecords?: NonAttribute<NutrientTableRecord[]>;

  @HasMany(() => FoodNutrient, 'foodId')
  declare nutrientMappings?: NonAttribute<FoodNutrient[]>;

  @BelongsToMany(() => Category, () => FoodCategory, 'foodId', 'categoryId')
  declare parentCategories?: NonAttribute<Category[]>;

  @HasMany(() => FoodCategory, 'foodId')
  declare parentCategoryMappings?: NonAttribute<FoodCategory[]>;

  @HasMany(() => FoodPortionSizeMethod, 'foodId')
  declare portionSizeMethods?: NonAttribute<FoodPortionSizeMethod[]>;

  @HasMany(() => FoodThumbnailImage, 'foodId')
  declare thumbnailImages?: NonAttribute<FoodThumbnailImage[]>;
}

export type FoodAttributes = Attributes<Food>;
export type FoodCreationAttributes = CreationAttributes<Food>;
