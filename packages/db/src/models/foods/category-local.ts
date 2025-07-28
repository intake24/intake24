import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, HasMany, Table } from 'sequelize-typescript';

import { Category, CategoryPortionSizeMethod, FoodsLocale } from '@intake24/db';

import BaseModel from '../model';

@Table({
  modelName: 'CategoryLocal',
  tableName: 'category_locals',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class CategoryLocal extends BaseModel<
  InferAttributes<CategoryLocal>,
  InferCreationAttributes<CategoryLocal>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(32),
  })
  declare categoryCode: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(16),
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

  @BelongsTo(() => Category, 'categoryCode')
  declare main?: NonAttribute<Category>;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;

  @HasMany(() => CategoryPortionSizeMethod, 'categoryLocalId')
  declare portionSizeMethods?: NonAttribute<CategoryPortionSizeMethod[]>;
}

export type CategoryLocalAttributes = Attributes<CategoryLocal>;
export type CategoryLocalCreationAttributes = CreationAttributes<CategoryLocal>;
