import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type AssociatedFood from './associated-foods';

import type Brand from './brand';
import type Category from './category';
import type FoodAttribute from './food-attribute';
import type FoodCategory from './food-category';
import type { FoodNutrientCreationAttributes } from './food-nutrient';
import type FoodNutrient from './food-nutrient';
import type { FoodPortionSizeMethodCreationAttributes } from './food-portion-size-method';
import type FoodPortionSizeMethod from './food-portion-size-method';
import type FoodThumbnailImage from './food-thumbnail-image';
import type FoodsLocale from './locale';
import type NutrientTableRecord from './nutrient-table-record';
import {
  Column,
  DataType,
  Table,
} from 'sequelize-typescript';
import BaseModel from '../model';

export type AlternativeFoodNames = Record<string, string[]>;

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
    defaultValue: '{}',
    type: DataType.STRING(2048),
    get(): AlternativeFoodNames {
      const val = this.getDataValue('altNames') as unknown;
      return val ? JSON.parse(val as string) : {};
    },
    set(value: AlternativeFoodNames) {
      this.setDataValue('altNames', JSON.stringify(value ?? {}));
    },
  })
  declare altNames: CreationOptional<AlternativeFoodNames>;

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

  declare associatedFoods?: NonAttribute<AssociatedFood[]>;

  declare attributes?: NonAttribute<FoodAttribute>;

  declare brands?: NonAttribute<Brand[]>;

  declare foodAssociations?: NonAttribute<AssociatedFood[]>;

  declare locale?: NonAttribute<FoodsLocale>;

  declare nutrientRecords?: NonAttribute<NutrientTableRecord[]>;

  declare nutrientMappings?: NonAttribute<FoodNutrient[]>;

  declare parentCategories?: NonAttribute<Category[]>;

  declare parentCategoryMappings?: NonAttribute<FoodCategory[]>;

  declare portionSizeMethods?: NonAttribute<FoodPortionSizeMethod[]>;

  declare thumbnailImages?: NonAttribute<FoodThumbnailImage[]>;
}

export type FoodAttributes = Attributes<Food>;
export type FoodCreationAttributes = CreationAttributes<Food>;
