import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'PAOccurrenceTransactionCount',
  tableName: 'pairwise_associations_transactions_count',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class PAOccurrenceTransactionCount extends BaseModel<
  InferAttributes<PAOccurrenceTransactionCount>,
  InferCreationAttributes<PAOccurrenceTransactionCount>
> {
  @Column({
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare transactionsCount: number;
}

export type PAOccurrenceTransactionCountAttributes = Attributes<PAOccurrenceTransactionCount>;
export type PAOccurrenceTransactionCountCreationAttributes
  = CreationAttributes<PAOccurrenceTransactionCount>;
