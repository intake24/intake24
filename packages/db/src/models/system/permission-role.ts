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
import Role from './role';

@Table({
  modelName: 'PermissionRole',
  tableName: 'permission_role',
  freezeTableName: true,
  underscored: true,
})
export default class PermissionRole extends BaseModel<
  InferAttributes<PermissionRole>,
  InferCreationAttributes<PermissionRole>
> {
  @ForeignKey(() => Permission)
  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare permissionId: string;

  @ForeignKey(() => Role)
  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare roleId: string;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;
}

export type PermissionRoleAttributes = Attributes<PermissionRole>;
export type PermissionRoleCreationAttributes = CreationAttributes<PermissionRole>;
