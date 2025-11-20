import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import User from './user';

@Table({
  modelName: 'UserPassword',
  tableName: 'user_passwords',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class UserPassword extends BaseModel<
  InferAttributes<UserPassword>,
  InferCreationAttributes<UserPassword>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  @ForeignKey(() => User)
  declare userId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare passwordHash: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare passwordSalt: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare passwordHasher: string;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User[]>;
}

export type UserPasswordAttributes = Attributes<UserPassword>;
export type UserPasswordCreationAttributes = CreationAttributes<UserPassword>;
