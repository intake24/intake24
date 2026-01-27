import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'PAOccurrence',
  tableName: 'pairwise_associations_occurrences',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class PAOccurrence extends BaseModel<
  InferAttributes<PAOccurrence>,
  InferCreationAttributes<PAOccurrence>
> {
  @Column({
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare localeId: string;

  @Column({
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare foodCode: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare occurrences: number;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare multiplier: CreationOptional<number | null>;
}

export type PAOccurrenceAttributes = Attributes<PAOccurrence>;
export type PAOccurrenceCreationAttributes = CreationAttributes<PAOccurrence>;
