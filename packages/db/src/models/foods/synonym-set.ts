import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, HasMany, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import FoodsLocale from './locale';
import RecipeFood from './recipe-food';

@Table({
  modelName: 'SynonymSet',
  tableName: 'synonym_sets',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SynonymSet extends BaseModel<
  InferAttributes<SynonymSet>,
  InferCreationAttributes<SynonymSet>
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
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.TEXT({ length: 'long' }),
  })
  declare synonyms: string;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;

  @HasMany(() => RecipeFood, 'id')
  declare recipeFoods?: NonAttribute<RecipeFood>[];
}

export type SynonymSetAttributes = Attributes<SynonymSet>;
export type SynonymSetCreationAttributes = CreationAttributes<SynonymSet>;
