import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type FoodsLocale from './locale';

import type RecipeFood from './recipe-food';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

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

  declare locale?: NonAttribute<FoodsLocale>;

  declare recipeFoods?: NonAttribute<RecipeFood>[];
}

export type SynonymSetAttributes = Attributes<SynonymSet>;
export type SynonymSetCreationAttributes = CreationAttributes<SynonymSet>;
