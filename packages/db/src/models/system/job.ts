import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { JobType, JobTypeParams } from '@intake24/common/types';

import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import User from './user';

@Table({
  modelName: 'Job',
  tableName: 'jobs',
  freezeTableName: true,
  underscored: true,
})
export default class Job extends BaseModel<InferAttributes<Job>, InferCreationAttributes<Job>> {
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
  declare type: JobType;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  @ForeignKey(() => User)
  declare userId: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.STRING(1024),
  })
  declare downloadUrl: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  declare downloadUrlExpiresAt: CreationOptional<Date | null>;

  @Column({
    allowNull: true,
    type: DataType.DOUBLE,
  })
  declare progress: CreationOptional<number | null>;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
  })
  declare successful: CreationOptional<boolean | null>;

  @Column({
    allowNull: true,
    type: DataType.TEXT({ length: 'long' }),
  })
  declare message: CreationOptional<string | null>;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare params: JobTypeParams;

  @Column({
    allowNull: true,
    type: DataType.TEXT({ length: 'long' }),
  })
  get stackTrace(): CreationOptional<string[] | null> {
    const val = this.getDataValue('stackTrace') as unknown;
    return val ? (val as string).split('\n') : null;
  }

  set stackTrace(value: string[] | null) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('stackTrace', value.join('\n'));
  }

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  declare startedAt: CreationOptional<Date | null>;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  declare completedAt: CreationOptional<Date | null>;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;
}

export type JobAttributes = Attributes<Job>;
export type JobCreationAttributes = CreationAttributes<Job>;
