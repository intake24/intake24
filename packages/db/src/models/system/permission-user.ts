import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Column, CreatedAt, DataType, ForeignKey, Table, UpdatedAt } from 'sequelize-typescript';

import BaseModel from '../model';
import Permission from './permission';
import User from './user';

@Table({
  modelName: 'PermissionUser',
  tableName: 'permission_user',
  freezeTableName: true,
  underscored: true,
})
export default class PermissionUser extends BaseModel<
  InferAttributes<PermissionUser>,
  InferCreationAttributes<PermissionUser>
> {
  @ForeignKey(() => Permission)
  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare permissionId: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare userId: string;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;
}

export type PermissionUserAttributes = Attributes<PermissionUser>;
export type PermissionUserCreationAttributes = CreationAttributes<PermissionUser>;
