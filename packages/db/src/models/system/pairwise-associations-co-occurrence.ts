import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'PACoOccurrence',
  tableName: 'pairwise_associations_co_occurrences',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class PACoOccurrence extends BaseModel<
  InferAttributes<PACoOccurrence>,
  InferCreationAttributes<PACoOccurrence>
> {
  @Column({
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare antecedentFoodCode: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare consequentFoodCode: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare occurrences: number;
}

export type PACoOccurrenceAttributes = Attributes<PACoOccurrence>;
export type PACoOccurrenceCreationAttributes = CreationAttributes<PACoOccurrence>;
