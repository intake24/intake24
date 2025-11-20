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
  ForeignKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import Role from './role';
import User from './user';

@Table({
  modelName: 'RoleUser',
  tableName: 'role_user',
  freezeTableName: true,
  underscored: true,
})
export default class RoleUser extends BaseModel<
  InferAttributes<RoleUser>,
  InferCreationAttributes<RoleUser>
> {
  @ForeignKey(() => Role)
  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare roleId: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare userId: string;

  @BelongsTo(() => Role, 'roleId')
  declare role?: NonAttribute<Role>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;
}

export type RoleUserAttributes = Attributes<RoleUser>;
export type RoleUserCreationAttributes = CreationAttributes<RoleUser>;
