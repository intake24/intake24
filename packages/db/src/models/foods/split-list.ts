import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import FoodsLocale from './locale';

@Table({
  modelName: 'SplitList',
  tableName: 'split_lists',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SplitList extends BaseModel<
  InferAttributes<SplitList>,
  InferCreationAttributes<SplitList>
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
    type: DataType.STRING(64),
  })
  declare firstWord: string;

  @Column({
    allowNull: false,
    type: DataType.TEXT({ length: 'long' }),
  })
  declare words: string;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;
}

export type SplitListAttributes = Attributes<SplitList>;
export type SplitListCreationAttributes = CreationAttributes<SplitList>;
