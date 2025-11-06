import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
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
import Survey from './survey';

@Scopes(() => ({
  survey: { include: [{ model: Survey }] },
}))
@Table({
  modelName: 'GenUserCounter',
  tableName: 'gen_user_counters',
  freezeTableName: true,
  underscored: true,
})
export default class GenUserCounter extends BaseModel<
  InferAttributes<GenUserCounter>,
  InferCreationAttributes<GenUserCounter>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare surveyId: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare count: number;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => Survey, 'surveyId')
  declare survey?: NonAttribute<Survey>;
}

export type GenUserCounterAttributes = Attributes<GenUserCounter>;
export type GenUserCounterCreationAttributes = CreationAttributes<GenUserCounter>;
