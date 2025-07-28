import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Scopes, Table } from 'sequelize-typescript';

import { Food, FoodsLocale } from '@intake24/db';

import BaseModel from '../model';

@Scopes(() => ({
  locale: { include: [{ model: FoodsLocale }] },
  food: { include: [{ model: Food }] },
}))
@Table({
  modelName: 'Brand',
  tableName: 'brands',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class Brand extends BaseModel<
  InferAttributes<Brand>,
  InferCreationAttributes<Brand>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Food)
  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare foodCode: string;

  @ForeignKey(() => FoodsLocale)
  @Column({
    allowNull: false,
    type: DataType.STRING(16),
  })
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

  @BelongsTo(() => Food, 'foodCode')
  declare food?: NonAttribute<Food>;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;
}

export type BrandAttributes = Attributes<Brand>;
export type BrandCreationAttributes = CreationAttributes<Brand>;
