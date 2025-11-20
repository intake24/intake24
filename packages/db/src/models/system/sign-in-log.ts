import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import User from './user';

@Scopes(() => ({
  user: { include: [{ model: User }] },
}))
@Table({
  modelName: 'SigninLog',
  tableName: 'signin_log',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SignInLog extends BaseModel<
  InferAttributes<SignInLog>,
  InferCreationAttributes<SignInLog>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare userId: CreationOptional<string | null>;

  @Column({
    allowNull: false,
    type: DataType.DATE,
    defaultValue: () => new Date(),
  })
  declare date: CreationOptional<Date>;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare remoteAddress: CreationOptional<string | null>;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare provider: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare providerKey: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare successful: boolean;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  declare message: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare userAgent: CreationOptional<string | null>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;
}

export type SignInLogAttributes = Attributes<SignInLog>;
export type SignInLogCreationAttributes = CreationAttributes<SignInLog>;
