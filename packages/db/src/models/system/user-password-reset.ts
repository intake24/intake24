import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { BelongsTo, Column, CreatedAt, DataType, Table, UpdatedAt } from 'sequelize-typescript';

import BaseModel from '../model';
import User from './user';

@Table({
  modelName: 'UserPasswordReset',
  tableName: 'user_password_resets',
  freezeTableName: true,
  underscored: true,
})
export default class UserPasswordReset
  extends BaseModel<InferAttributes<UserPasswordReset>, InferCreationAttributes<UserPasswordReset>>
  implements UserPasswordResetAttributes {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare userId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare token: string;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;
}

export type UserPasswordResetAttributes = Attributes<UserPasswordReset>;
export type UserPasswordResetCreationAttributes = CreationAttributes<UserPasswordReset>;
