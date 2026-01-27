import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { RequiredLocaleTranslation } from '@intake24/common/types';

import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import FoodsLocale from './locale';
import RecipeFood from './recipe-food';

@Scopes(() => ({
  list: {
    attributes: [
      'id',
      'recipeFoodsId',
      'code',
      'order',
      'name',
      'description',
      'repeatable',
      'required',
    ],
    order: [['order', 'ASC']],
  },
}))
@Table({
  modelName: 'RecipeFoodStep',
  tableName: 'recipe_foods_steps',
  freezeTableName: true,
  underscored: true,
})
export default class RecipeFoodStep extends BaseModel<
  InferAttributes<RecipeFoodStep>,
  InferCreationAttributes<RecipeFoodStep>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare recipeFoodsId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
    unique: true,
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare localeId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare categoryCode: string;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare name: RequiredLocaleTranslation;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare description: RequiredLocaleTranslation;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare repeatable: boolean;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare required: boolean;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare order: number;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => RecipeFood, 'recipeFoodsId')
  declare recipeFood?: NonAttribute<RecipeFood>;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;
}

export type RecipeFoodStepAttributes = Attributes<RecipeFoodStep>;
export type RecipeFoodsStepCreationAttributes = CreationAttributes<RecipeFoodStep>;
