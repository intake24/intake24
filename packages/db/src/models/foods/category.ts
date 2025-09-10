import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  HasOne,
  Table,
} from 'sequelize-typescript';
import {
  AssociatedFood,
  CategoryAttribute,
  CategoryCategory,
  CategoryPortionSizeMethod,
  Food,
  FoodCategory,
  FoodsLocale,
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

  @HasOne(() => CategoryAttribute, 'categoryId')
  declare attributes?: NonAttribute<CategoryAttribute>;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;

  @HasMany(() => AssociatedFood, { foreignKey: 'associatedCategoryCode', sourceKey: 'code', constraints: false })
  declare categoryAssociations?: NonAttribute<AssociatedFood[]>;

  @BelongsToMany(() => Category, () => CategoryCategory, 'subCategoryId', 'categoryId')
  declare parentCategories?: NonAttribute<Category[]>;

  @HasMany(() => CategoryCategory, 'subCategoryId')
  declare parentCategoryMappings?: NonAttribute<CategoryCategory[]>;

  @BelongsToMany(() => Category, () => CategoryCategory, 'categoryId', 'subCategoryId')
  declare subCategories?: NonAttribute<Category[]>;

  @HasMany(() => CategoryCategory, 'categoryId')
  declare subcategoryMappings?: NonAttribute<CategoryCategory[]>;

  @BelongsToMany(() => Food, () => FoodCategory, 'categoryId', 'foodId')
  declare foods?: NonAttribute<Food[]>;

  @HasMany(() => FoodCategory, 'categoryId')
  declare foodLinks?: NonAttribute<FoodCategory[]>;

  @HasMany(() => CategoryPortionSizeMethod, 'categoryId')
  declare portionSizeMethods?: NonAttribute<CategoryPortionSizeMethod[]>;
}

export type CategoryAttributes = Attributes<Category>;
export type CategoryCreationAttributes = CreationAttributes<Category>;
