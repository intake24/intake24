import type { Attributes, CreationAttributes, CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize';

import type { FoodBuilderStep, FoodBuilderType } from '@intake24/common/types/http/admin';

import { BelongsTo, Column, CreatedAt, DataType, Table, UpdatedAt } from 'sequelize-typescript';

import BaseModel from '../model';
import FoodsLocale from './locale';
import SynonymSet from './synonym-set';

@Table({
  modelName: 'FoodBuilder',
  tableName: 'food_builders',
  freezeTableName: true,
  underscored: true,
})
export default class FoodBuilder extends BaseModel<
  InferAttributes<FoodBuilder>,
  InferCreationAttributes<FoodBuilder>
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
    unique: 'food_builders_unique',
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: 'food_builders_unique',
  })
  declare localeId: string;

  @Column({
    type: DataType.ENUM('generic', 'recipe'),
    allowNull: false,
  })
  declare type: FoodBuilderType;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare triggerWord: string;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare synonymSetId: string | null;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare steps: FoodBuilderStep[];

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;

  @BelongsTo(() => SynonymSet, 'synonymSetId')
  declare synonymSet?: Attributes<SynonymSet>;
}

export type FoodBuilderAttributes = Attributes<FoodBuilder>;
export type FoodBuilderCreationAttributes = CreationAttributes<FoodBuilder>;
