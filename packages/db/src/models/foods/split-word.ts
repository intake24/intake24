import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type FoodsLocale from './locale';

import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'SplitWord',
  tableName: 'split_words',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SplitWord extends BaseModel<
  InferAttributes<SplitWord>,
  InferCreationAttributes<SplitWord>
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
  declare words: string;

  declare locale?: NonAttribute<FoodsLocale>;
}

export type SplitWordAttributes = Attributes<SplitWord>;
export type SplitWordCreationAttributes = CreationAttributes<SplitWord>;
